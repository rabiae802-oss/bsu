document.addEventListener('DOMContentLoaded', () => {
    
    if(localStorage.getItem('studentID')) {
        window.location.href = 'pages/student.html';
        return;
    }
    if(localStorage.getItem('adminID')) {
        window.location.href = 'pages/admin.html';
        return;
    }

    const btnStudent = document.getElementById('btn-student');
    const btnAdmin = document.getElementById('btn-admin');
    const studentForm = document.getElementById('student-form');
    const adminForm = document.getElementById('admin-form');
    
    const modalOverlay = document.getElementById('custom-modal');

    function showModal(title, message, isSuccess, redirectUrl = null) {
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalBox = document.querySelector('.modal-box');
        const modalIcon = document.getElementById('modal-icon');
        const closeBtn = document.getElementById('modal-close-btn');
        
        modalTitle.innerText = title;
        modalMessage.innerText = message;
        
        if (isSuccess) {
            modalBox.classList.remove('modal-error');
            modalBox.classList.add('modal-success');
            modalIcon.className = 'fas fa-check';
        } else {
            modalBox.classList.remove('modal-success');
            modalBox.classList.add('modal-error');
            modalIcon.className = 'fas fa-times';
        }
        
        modalOverlay.style.display = 'flex';

        closeBtn.onclick = () => {
            modalOverlay.style.display = 'none';
            if (isSuccess && redirectUrl) {
                window.location.href = redirectUrl;
            }
        };

        if (isSuccess && redirectUrl) {
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);
        }
    }

    btnStudent.addEventListener('click', () => {
        btnStudent.classList.add('active');
        btnAdmin.classList.remove('active');
        studentForm.classList.add('active-form');
        adminForm.classList.remove('active-form');
    });

    btnAdmin.addEventListener('click', () => {
        btnAdmin.classList.add('active');
        btnStudent.classList.remove('active');
        adminForm.classList.add('active-form');
        studentForm.classList.remove('active-form');
    });

    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = studentForm.querySelector('button');
        const originalText = btn.innerText;
        
        btn.innerText = "Verifying...";
        btn.disabled = true;

        const username = document.getElementById('student-name').value.trim();
        const password = document.getElementById('student-seat').value.trim();

        const result = await window.checkStudentLogin(username, password);

        btn.innerText = originalText;
        btn.disabled = false;

        if (result.success) {
            localStorage.setItem('studentID', result.user.id);
            showModal("Welcome", "Login successful, redirecting to dashboard...", true, 'pages/student.html');
        } else {
            showModal("Login Failed", result.message, false);
        }
    });

    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = adminForm.querySelector('button');
        const originalText = btn.innerText;
        
        btn.innerText = "Verifying...";
        btn.disabled = true;

        const nameInput = document.getElementById('admin-name').value.trim();
        const codeInput = document.getElementById('admin-code').value.trim();

        const result = await window.checkAdminLogin(nameInput, codeInput);

        btn.innerText = originalText;
        btn.disabled = false;

        if (result.success) {
            localStorage.setItem('adminID', result.user.id);
            localStorage.setItem('adminName', result.user.username);
            
            showModal("Welcome Admin", "Access granted. Redirecting to dashboard...", true, 'pages/admin.html');
        } else {
            showModal("Access Denied", result.message, false);
        }
    });
});