document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const userType = urlParams.get('type');
    const token = localStorage.getItem('token');
    
    async function fetchUserProfile() {
        if (!userId || !userType) return;
        try {
            const res = await fetch(`/api/profile/${userType}/${userId}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            if (res.ok) {
                const user = await res.json();
                document.getElementById('profileName').textContent = user.username || 'Freelancer Name';
                document.getElementById('profileDomain').textContent = user.domain || 'Domain';
                document.getElementById('jobsCompleted').textContent = user.jobsCompleted || 0;
                document.getElementById('rating').textContent = user.rating || '0.0';
                document.getElementById('about').textContent = user.profile || 'No description provided';
                document.getElementById('skills').textContent = user.skills || 'No skills added yet';
                document.getElementById('portfolio').textContent = user.portfolio || 'No portfolio link added yet';
                if (user.profileImageUrl) {
                    document.getElementById('profileImage').src = user.profileImageUrl;
                }
            }
        } catch (err) {
            // Optionally show error
        }
    }
    fetchUserProfile();

    // Home button
    document.getElementById('homeBtn').addEventListener('click', () => {
        window.location.href = 'employer-home.html';
    });

    // Fetch and display gigs
    async function fetchGigs() {
        const gigsContainer = document.getElementById('gigsContainer');
        gigsContainer.innerHTML = '<div>Loading gigs...</div>';
        try {
            const res = await fetch(`/api/gigs/user/${userId}`);
            const gigs = await res.json();
            if (Array.isArray(gigs) && gigs.length > 0) {
                gigsContainer.innerHTML = gigs.map(gig => `
                    <div class="gig-card">
                        <div class="gig-title">${gig.title}</div>
                        <div class="gig-category">${gig.category}</div>
                        <div class="gig-description">${gig.description}</div>
                        <div class="gig-price">$${gig.price}</div>
                    </div>
                `).join('');
            } else {
                gigsContainer.innerHTML = '<div>No gigs found.</div>';
            }
        } catch (err) {
            gigsContainer.innerHTML = '<div style="color:#d32f2f">Failed to load gigs.</div>';
        }
    }
    if (userId) fetchGigs();

    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.onclick = null; // Remove any previous handler
        connectBtn.addEventListener('click', async () => {
            try {
                const freelancerId = getFreelancerId(); // Get freelancer ID from URL or data attribute
                const response = await fetch('/api/chat/session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ freelancerId })
                });

                const chat = await response.json();
                if (response.ok) {
                    window.location.href = `/chat.html?chatId=${chat._id}`;
                } else {
                    alert(chat.message || 'Failed to start chat. Please make sure you are logged in as an employer.');
                }
            } catch (error) {
                alert('Error creating chat session.');
                console.error('Error creating chat session:', error);
            }
        });
    }

    // Get current user ID from token
    function getCurrentUserId() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        // Decode JWT token to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    }

    // Get freelancer ID from URL
    function getFreelancerId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }
}); 