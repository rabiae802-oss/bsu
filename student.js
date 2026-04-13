document.addEventListener('DOMContentLoaded', async () => {
    
    const studentID = localStorage.getItem('studentID');
    if (!studentID) {
        window.location.href = '../index.html';
        return;
    }

    const loadingEl = document.getElementById('loading-spinner');
    const contentEl = document.getElementById('dashboard-content');
    let studentData = null;
    
    try {
        const { data: student, error } = await window.fetchStudentDetails(studentID);
        
        if (error || !student) {
            window.logoutStudent();
            return;
        }

        studentData = student;
        
        document.getElementById('welcome-name').innerText = student.full_name.split(' ')[0];
        document.getElementById('modal-full-name').innerText = student.full_name;
        document.getElementById('modal-seat').innerText = student.seat_number;
        document.getElementById('modal-nid').innerText = student.national_id;
        document.getElementById('modal-dept').innerText = student.department;

        document.getElementById('pdf-name').innerText = student.full_name;
        document.getElementById('pdf-seat').innerText = student.seat_number;
        document.getElementById('pdf-nid').innerText = student.national_id;
        document.getElementById('pdf-dept').innerText = student.department;

        const examTableBody = document.getElementById('exam-table-body');
        examTableBody.innerHTML = '';
        if (student.exam_schedule?.length > 0) {
            student.exam_schedule.forEach(exam => {
                examTableBody.innerHTML += `
                    <tr>
                        <td><strong>${exam.subject}</strong></td>
                        <td>${exam.day}</td>
                        <td>${exam.date}</td>
                        <td style="color: #0069d9; font-weight:700;">${exam.time}</td>
                    </tr>
                `;
            });
        }

        const gradesTableBody = document.getElementById('grades-table-body');
        gradesTableBody.innerHTML = '';
        if (student.grades_data?.length > 0) {
            student.grades_data.forEach(grade => {
                let badgeClass = 'grade-pass';
                if (grade.grade.includes('Excellent') || grade.grade.includes('امتياز')) badgeClass = 'grade-excellent';
                else if (grade.grade.includes('Very Good') || grade.grade.includes('جيد جدا')) badgeClass = 'grade-verygood';
                else if (grade.grade.includes('Good') || grade.grade.includes('جيد')) badgeClass = 'grade-good';

                gradesTableBody.innerHTML += `
                    <tr>
                        <td>${grade.subject}</td>
                        <td>${grade.max}</td>
                        <td style="font-weight:bold;">${grade.degree}</td>
                        <td><span class="grade-badge ${badgeClass}">${grade.grade}</span></td>
                    </tr>
                `;
            });
        }

        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';

    } catch (err) {
        window.location.href = '../index.html';
    }

    const profileOverlay = document.getElementById('profile-overlay');
    const downloadOverlay = document.getElementById('download-overlay');

    document.getElementById('profile-trigger').onclick = () => {
        profileOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    };

    document.getElementById('download-trigger').onclick = () => {
        downloadOverlay.classList.add('active');
        document.body.classList.add('no-scroll');
    };

    const closeAll = () => {
        profileOverlay.classList.remove('active');
        downloadOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
    };

    document.getElementById('close-profile').onclick = closeAll;
    document.getElementById('close-download').onclick = closeAll;

    window.exportToPDF = function(type) {
        let element;
        let filename = 'Document.pdf';
        const pdfHeader = document.getElementById('pdf-personal-info');
        const welcomeSection = document.getElementById('welcome-section');

        if (type === 'profile') {
            element = document.getElementById('profile-card-pdf');
            filename = `Profile_${studentData.seat_number}.pdf`;
        } else if (type === 'exams') {
            element = document.getElementById('exam-section');
            filename = `Exams_${studentData.seat_number}.pdf`;
        } else if (type === 'grades') {
            element = document.getElementById('grades-section');
            filename = `Grades_${studentData.seat_number}.pdf`;
        } else if (type === 'all') {
            element = document.getElementById('main-report-area');
            filename = `Full_Record_${studentData.seat_number}.pdf`;
            pdfHeader.style.display = 'block';
            welcomeSection.style.display = 'none';
        }

        const opt = {
            margin: [15, 15],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const hideTargets = document.querySelectorAll('.hide-on-pdf');
        hideTargets.forEach(el => el.style.display = 'none');

        const style = document.createElement('style');
        style.innerHTML = `
            table { width: 100% !important; border-collapse: collapse !important; margin: 20px 0 !important; }
            th, td { border: 1px solid #ddd !important; padding: 12px !important; text-align: center !important; }
            th { background-color: #004d80 !important; color: white !important; }
            .table-section { box-shadow: none !important; border: 1px solid #eee !important; margin: 10px auto !important; width: 95% !important; }
        `;
        document.head.appendChild(style);

        html2pdf().set(opt).from(element).save().then(() => {
            pdfHeader.style.display = 'none';
            welcomeSection.style.display = 'block';
            hideTargets.forEach(el => el.style.display = '');
            style.remove();
        });
    };

    document.getElementById('logout-btn').onclick = () => {
        profileOverlay.classList.remove('active');
        document.getElementById('confirm-logout-modal').classList.add('active');
    };

    document.getElementById('confirm-no-btn').onclick = () => {
        document.getElementById('confirm-logout-modal').classList.remove('active');
    };

    document.getElementById('confirm-yes-btn').onclick = () => {
        window.logoutStudent();
    };
});