document.addEventListener('DOMContentLoaded', async () => {
    // Get token from localStorage (set on login/register)
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/freelancer/me', {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        if (res.ok) {
            const user = await res.json();
            document.getElementById('freelancerName').textContent = user.username || 'Freelancer';
            // Update stats if present
            if (user.jobsApplied !== undefined) {
                document.getElementById('jobsApplied').textContent = user.jobsApplied;
            }
            if (user.jobsWon !== undefined) {
                document.getElementById('jobsWon').textContent = user.jobsWon;
            }
            if (user.profileCompleteness !== undefined) {
                document.getElementById('profileCompleteness').textContent = user.profileCompleteness + '%';
            }
            // Add My Profile button logic
            const profileBtn = document.getElementById('profileBtn');
            if (profileBtn) {
                profileBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = `freelancer_profile.html?id=${user._id}&type=freelancer`;
                });
            }
        } else {
            document.getElementById('freelancerName').textContent = 'Freelancer';
        }
    } catch (err) {
        document.getElementById('freelancerName').textContent = 'Freelancer';
    }

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

    // Find Job button functionality
    const findJobBtn = document.getElementById('findJobBtn');
    if (findJobBtn) {
        findJobBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'find_jobs.html';
        });
    }
}); 