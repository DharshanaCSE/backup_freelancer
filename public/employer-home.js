document.addEventListener('DOMContentLoaded', () => {
    // Sign Out functionality
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            const confirmed = confirm('Are you sure you want to sign out?');
            if (confirmed) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
        });
    }
    // My Profile button redirect
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/employer/me', {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });
                if (res.ok) {
                    const user = await res.json();
                    if (user._id) {
                        window.location.href = `employer_profile.html?id=${user._id}&type=employer`;
                    } else {
                        alert('User ID not found!');
                    }
                }
            } catch (err) {
                alert('Could not fetch employer info.');
            }
        });
    }
}); 