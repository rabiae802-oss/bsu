const SUPABASE_URL = 'https://kpwvehwayidyrmhyizbx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iJ467sSAioVX6JgQg4rJcg_pLFxLain';

if (typeof supabase === 'undefined') {
    console.error("Error: Supabase library not loaded.");
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DEMO_USERNAME = 'islam rabea';
const DEMO_PASSWORD = '12345';

window.checkStudentLogin = async function(usernameInput, passwordInput) {
    try {
        const username = usernameInput.trim().toLowerCase();
        const password = passwordInput.trim();

        if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
            return { success: false, message: 'Login failed (Incorrect Username or Password)' };
        }

        const { data, error } = await supabaseClient
            .from('students')
            .select('id, full_name, seat_number')
            .order('id', { ascending: true })
            .limit(1);

        if (error) {
            console.error('Student DB Error:', error);
            return { success: false, message: 'Technical error in database' };
        }

        if (data && data.length > 0) {
            return { success: true, message: 'Identity verified successfully', user: data[0] };
        }

        return { success: false, message: 'No student data found in database' };
    } catch (err) {
        console.error('System Error:', err);
        return { success: false, message: 'Unexpected system error' };
    }
};

window.checkAdminLogin = async function(usernameInput, codeInput) {
    try {
        const username = usernameInput.trim().toLowerCase();
        const password = codeInput.trim();

        if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
            return {
                success: true,
                message: 'Admin privileges verified',
                user: { id: 'demo-admin', username: 'islam rabea' }
            };
        }

        return { success: false, message: 'Login failed (Incorrect Username or Password)' };
    } catch (err) {
        console.error('System Error:', err);
        return { success: false, message: 'Unexpected system error' };
    }
};

window.fetchStudentDetails = async function(id) {
    const { data, error } = await supabaseClient
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
    return { data, error };
};

window.logoutStudent = function() {
    localStorage.removeItem('studentID');
    window.location.href = '../index.html'; 
};