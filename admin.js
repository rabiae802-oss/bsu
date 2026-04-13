document.addEventListener('DOMContentLoaded', async () => {
    
    const adminID = localStorage.getItem('adminID');
    const adminName = localStorage.getItem('adminName');
    if (!adminID) { window.location.href = '../index.html'; return; }
    document.getElementById('admin-name-display').innerText = adminName || "Admin";
    
    const loadingEl = document.getElementById('loading-spinner');
    setTimeout(() => { loadingEl.style.display = 'none'; }, 500);

    const dashboardHome = document.getElementById('dashboard-home');
    const studentEditor = document.getElementById('student-editor');
    
    window.openModal = function(id) {
        document.getElementById(id).classList.add('active');
        document.body.classList.add('no-scroll');
        if(id === 'student-list-modal') loadAllStudents(); 
    };

    window.closeModal = function(id) {
        document.getElementById(id).classList.remove('active');
        document.body.classList.remove('no-scroll');
    };

    window.showConfirmModal = function(message, onYes) {
        const modal = document.getElementById('custom-confirm-modal');
        const msgEl = document.getElementById('confirm-msg-text');
        const yesBtn = document.getElementById('confirm-yes-btn');
        const noBtn = document.getElementById('confirm-no-btn');

        const newYes = yesBtn.cloneNode(true);
        const newNo = noBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYes, yesBtn);
        noBtn.parentNode.replaceChild(newNo, noBtn);

        msgEl.innerText = message;
        modal.classList.add('active');
        
        newYes.onclick = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                if(typeof onYes === 'function') onYes();
            }, 300);
        };

        newNo.onclick = () => {
            modal.classList.remove('active');
        };
    };

    document.getElementById('card-general-schedule').onclick = () => openModal('general-schedule-modal');
    document.getElementById('card-add-student').onclick = () => openModal('add-student-modal');
    document.getElementById('card-list-students').onclick = () => openModal('student-list-modal');

    document.getElementById('confirm-general-schedule').onclick = async () => {
        const modalId = 'general-schedule-modal';
        closeModal(modalId);
        showConfirmModal('Are you sure? This will override everyone\'s schedule!', async () => {
            loadingEl.style.display = 'flex';
            const examRows = document.querySelectorAll('#general-exam-body tr');
            const generalSchedule = Array.from(examRows).map(row => {
                const inputs = row.querySelectorAll('input');
                return inputs[0].value.trim() ? { 
                    subject: inputs[0].value.trim(), 
                    day: inputs[1].value.trim(), 
                    date: inputs[2].value.trim(), 
                    time: inputs[3].value.trim() 
                } : null;
            }).filter(Boolean);
            try {
                await supabaseClient.from('students').update({ exam_schedule: generalSchedule }).gt('id', 0);
                showToast('Schedule Deployed'); 
            } catch (err) { showToast('Error', true); } 
            finally { loadingEl.style.display = 'none'; }
        });
    };

    document.getElementById('confirm-add-student').onclick = async () => {
        const name = document.getElementById('new-name').value.trim();
        const seat = document.getElementById('new-seat').value.trim();
        const nid = document.getElementById('new-nid').value.trim();
        const dept = document.getElementById('new-dept').value.trim();

        if(!name || !seat || !nid) { showToast('Missing Data', true); return; }

        loadingEl.style.display = 'flex';
        const examSchedule = collectTableData('new-exam-body');
        const gradesData = collectTableDataGrades('new-grades-body');

        try {
            await supabaseClient.from('students').insert([{
                full_name: name, 
                seat_number: seat, 
                national_id: nid, 
                department: dept, 
                exam_schedule: examSchedule, 
                grades_data: gradesData
            }]);

            showToast('Student Added Successfully'); 
            closeModal('add-student-modal');
            
            document.querySelectorAll('#add-student-modal input').forEach(i => i.value = '');
            document.getElementById('new-exam-body').innerHTML = ''; 
            document.getElementById('new-grades-body').innerHTML = '';

        } catch (err) { 
            console.error(err);
            showToast('Error: Seat number might be duplicate', true); 
        } finally { 
            loadingEl.style.display = 'none'; 
        }
    };

    let allStudentsCache = [];
    async function loadAllStudents() {
        const container = document.getElementById('students-list-container');
        const counterBadge = document.getElementById('total-students-count');
        container.innerHTML = '<div style="text-align:center;padding:20px">Loading...</div>';
        
        const { data, error } = await supabaseClient.from('students').select('id, full_name, seat_number').order('id', { ascending: false });
        if(error) { container.innerHTML = 'Error'; return; }
        
        const count = data.length;
        counterBadge.innerText = `${count} Student`;
        allStudentsCache = data; renderStudentsList(data);
    }

    function renderStudentsList(students) {
        const container = document.getElementById('students-list-container');
        container.innerHTML = '';
        if(students.length === 0) { container.innerHTML = '<div style="padding:15px;text-align:center">No students found</div>'; return; }
        students.forEach(stu => {
            const div = document.createElement('div'); div.className = 'student-list-item';
            div.innerHTML = `<div class="stu-info"><h4>${stu.full_name}</h4><span>${stu.seat_number}</span></div><div class="stu-actions"><button class="list-btn btn-edit" onclick="editFromList(${stu.seat_number})"><i class="fas fa-pen"></i></button><button class="list-btn btn-del" onclick="deleteFromList(${stu.id})"><i class="fas fa-trash"></i></button></div>`;
            container.appendChild(div);
        });
    }

    document.getElementById('delete-all-btn').onclick = () => {
        showConfirmModal('EXTREME WARNING: Are you sure you want to delete ALL students? This cannot be undone!', () => {
            showConfirmModal('Final Confirmation: Delete everything?', async () => {
                loadingEl.style.display = 'flex';
                try {
                    const { error } = await supabaseClient.from('students').delete().neq('id', 0);
                    if(error) throw error;
                    showToast('All students deleted successfully');
                    loadAllStudents();
                } catch(err) {
                    showToast('Error during deletion', true);
                    console.error(err);
                } finally {
                    loadingEl.style.display = 'none';
                }
            });
        });
    };

    document.getElementById('list-search-input').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        renderStudentsList(allStudentsCache.filter(s => s.full_name.toLowerCase().includes(term) || s.seat_number.toString().includes(term)));
    });

    window.editFromList = function(seat) { closeModal('student-list-modal'); document.getElementById('search-input').value = seat; performSearch(seat); };
    window.deleteFromList = function(id) {
        showConfirmModal('Delete this student?', async () => {
            loadingEl.style.display = 'flex';
            try { await supabaseClient.from('students').delete().eq('id', id); showToast('Deleted'); loadAllStudents(); } 
            catch(err) { showToast('Error', true); } finally { loadingEl.style.display = 'none'; }
        });
    };

    const searchWrapper = document.querySelector('.search-wrapper');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const backBtn = document.getElementById('back-to-dash');
    
    searchBtn.onclick = () => { if(!searchWrapper.classList.contains('active')) { searchWrapper.classList.add('active'); searchInput.focus(); } else performSearch(); };
    searchInput.onkeypress = (e) => { if(e.key==='Enter') performSearch(); };
    backBtn.onclick = () => { studentEditor.style.display='none'; dashboardHome.style.display='grid'; searchInput.value=''; };

    async function performSearch(seatOverride = null) {
        const seatNum = seatOverride || searchInput.value.trim();
        if(!seatNum) return;
        loadingEl.style.display = 'flex';
        try {
            const { data, error } = await supabaseClient.from('students').select('*').eq('seat_number', seatNum).single();
            if(error || !data) showToast('Not Found', true);
            else { fillStudentData(data); dashboardHome.style.display='none'; studentEditor.style.display='block'; }
        } catch(err) { console.error(err); } finally { loadingEl.style.display='none'; }
    }

    function fillStudentData(student) {
        document.getElementById('current-student-id').value = student.id;
        document.getElementById('edit-name').value = student.full_name;
        document.getElementById('edit-seat').value = student.seat_number;
        document.getElementById('edit-nid').value = student.national_id;
        document.getElementById('edit-dept').value = student.department;
        ['edit-name','edit-seat','edit-nid','edit-dept'].forEach(id=>document.getElementById(id).disabled=true);
        const examBody = document.getElementById('edit-exam-body'); examBody.innerHTML = '';
        if(student.exam_schedule) student.exam_schedule.forEach(e => addExamRow('edit-exam-body', e.subject, e.day, e.date, e.time));
        const gradesBody = document.getElementById('edit-grades-body'); gradesBody.innerHTML = '';
        if(student.grades_data) student.grades_data.forEach(g => addGradeRow('edit-grades-body', g.subject, g.max, g.degree, g.grade));
    }

    document.getElementById('delete-student-btn').onclick = async () => {
        const id = document.getElementById('current-student-id').value;
        showConfirmModal('Delete this student?', async () => {
            loadingEl.style.display='flex'; 
            await supabaseClient.from('students').delete().eq('id', id); 
            showToast('Deleted'); 
            loadingEl.style.display='none'; 
            backBtn.click(); 
        });
    };

    document.getElementById('save-changes-btn').onclick = async () => {
        const id = document.getElementById('current-student-id').value;
        loadingEl.style.display='flex';
        const fullName = document.getElementById('edit-name').value.trim();
        const seatNum = document.getElementById('edit-seat').value.trim();
        const nid = document.getElementById('edit-nid').value.trim();
        const dept = document.getElementById('edit-dept').value.trim();
        
        const examSchedule = collectTableData('edit-exam-body');
        const gradesData = collectTableDataGrades('edit-grades-body');
        try { await supabaseClient.from('students').update({full_name:fullName, seat_number:seatNum, national_id:nid, department:dept, exam_schedule:examSchedule, grades_data:gradesData}).eq('id', id); showToast('Saved Successfully'); } 
        catch(e) { showToast('Error', true); } finally { loadingEl.style.display='none'; }
    };

    window.addExamRow = function(bodyId, s='', d='', dt='', t='') {
        document.getElementById(bodyId).insertAdjacentHTML('beforeend', `<tr><td><input type="text" value="${s}" placeholder="Subject"></td><td><input type="text" value="${d}" placeholder="Day"></td><td><input type="date" value="${dt}"></td><td><input type="text" value="${t}" placeholder="Time"></td><td><button class="delete-row-btn" style="color:red;border:none;background:none" onclick="this.closest('tr').remove()"><i class="fas fa-trash"></i></button></td></tr>`);
    };
    window.addGradeRow = function(bodyId, s='', m='', deg='', g='') {
        document.getElementById(bodyId).insertAdjacentHTML('beforeend', `<tr><td><input type="text" value="${s}" placeholder="Subject"></td><td><input type="number" value="${m}" placeholder="Max"></td><td><input type="number" value="${deg}" placeholder="Score"></td><td><input type="text" value="${g}" placeholder="Grade"></td><td><button class="delete-row-btn" style="color:red;border:none;background:none" onclick="this.closest('tr').remove()"><i class="fas fa-trash"></i></button></td></tr>`);
    };
    
    function collectTableData(bodyId) { 
        return Array.from(document.querySelectorAll(`#${bodyId} tr`)).map(row => { 
            const i = row.querySelectorAll('input'); 
            return i[0].value.trim() ? { 
                subject:i[0].value.trim(), 
                day:i[1].value.trim(), 
                date:i[2].value.trim(), 
                time:i[3].value.trim()
            } : null; 
        }).filter(Boolean); 
    }
    
    function collectTableDataGrades(bodyId) { 
        return Array.from(document.querySelectorAll(`#${bodyId} tr`)).map(row => { 
            const i = row.querySelectorAll('input'); 
            return i[0].value.trim() ? { 
                subject:i[0].value.trim(), 
                max:i[1].value.trim(), 
                degree:i[2].value.trim(), 
                grade:i[3].value.trim()
            } : null; 
        }).filter(Boolean); 
    }
    
    window.toggleEdit = function(id) { const el=document.getElementById(id); el.disabled=!el.disabled; if(!el.disabled) el.focus(); };

    const po = document.getElementById('profile-overlay');
    document.getElementById('profile-trigger').onclick = () => { po.classList.add('active'); document.body.classList.add('no-scroll'); };
    document.getElementById('close-profile').onclick = () => { po.classList.remove('active'); document.body.classList.remove('no-scroll'); };
    
    document.getElementById('logout-btn').onclick = () => { 
        closeModal('profile-overlay');
        showConfirmModal('Are you sure you want to logout?', () => {
            localStorage.removeItem('adminID'); localStorage.removeItem('adminName'); window.location.href='../index.html'; 
        });
    };

    document.getElementById('change-pass-btn').onclick = async () => {
        const newCode = document.getElementById('new-password').value.trim();
        if(newCode.length<6) { showToast('Too Short', true); return; }
        loadingEl.style.display='flex';
        try { await supabaseClient.from('admins').update({access_code:newCode}).eq('id', localStorage.getItem('adminID')); showToast('Password Changed'); document.getElementById('new-password').value=''; }
        catch(e){ showToast('Failed', true); } finally { loadingEl.style.display='none'; }
    };
    function showToast(m, err=false) { const t=document.getElementById('toast-notification'); document.getElementById('toast-msg').innerText=m; t.style.background=err?'#d32f2f':'#2e7d32'; t.style.display='flex'; setTimeout(()=>t.style.display='none',3000); }
});