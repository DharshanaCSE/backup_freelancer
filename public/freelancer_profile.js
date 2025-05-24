document.addEventListener('DOMContentLoaded', () => {
    // Get userId and userType from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const userType = urlParams.get('type');
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch and display user info
    async function fetchUserProfile() {
        if (!userId || !userType) return;
        try {
            const res = await fetch(`/api/profile/${userType}/${userId}`, { headers });
            if (res.ok) {
                const user = await res.json();
                if (document.getElementById('profileName')) document.getElementById('profileName').textContent = user.username || 'Freelancer Name';
                if (document.getElementById('profileDomain')) document.getElementById('profileDomain').textContent = user.domain || 'Domain';
                if (document.getElementById('about')) document.getElementById('about').textContent = user.profile || 'No description provided';
                if (document.getElementById('skills')) document.getElementById('skills').textContent = user.skills || 'No skills added yet';
                if (document.getElementById('portfolio')) document.getElementById('portfolio').textContent = user.portfolio || 'No portfolio link added yet';
                if (user.profileImageUrl && document.getElementById('profileImage')) {
                    document.getElementById('profileImage').src = user.profileImageUrl;
                }
                // Experience display logic
                if (document.getElementById('profileExperience')) {
                    if (typeof user.experience === 'number') {
                        document.getElementById('profileExperience').innerHTML = `Experience: <span class='exp-num'>${user.experience}</span> years`;
                    } else {
                        document.getElementById('profileExperience').textContent = 'Experience: Not mentioned';
                    }
                }
                // Fetch active jobs and completed jobs count for this freelancer
                fetchActiveJobsCount(userId);
                fetchCompletedJobsCount(userId);
            }
        } catch (err) {
            // Optionally show error
        }
    }

    // Fetch and display active jobs count
    async function fetchActiveJobsCount(freelancerId) {
        try {
            const res = await fetch(`/api/jobs/active?freelancerId=${freelancerId}`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (document.getElementById('activeJobs')) document.getElementById('activeJobs').textContent = data.activeJobs || 0;
            } else {
                if (document.getElementById('activeJobs')) document.getElementById('activeJobs').textContent = 0;
            }
        } catch (err) {
            if (document.getElementById('activeJobs')) document.getElementById('activeJobs').textContent = 0;
        }
    }

    // Fetch and display completed jobs count
    async function fetchCompletedJobsCount(freelancerId) {
        try {
            const res = await fetch(`/api/jobs/completed?freelancerId=${freelancerId}`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (document.getElementById('jobsCompleted')) document.getElementById('jobsCompleted').textContent = data.jobsCompleted || 0;
            } else {
                if (document.getElementById('jobsCompleted')) document.getElementById('jobsCompleted').textContent = 0;
            }
        } catch (err) {
            if (document.getElementById('jobsCompleted')) document.getElementById('jobsCompleted').textContent = 0;
        }
    }

    fetchUserProfile();

    // Fetch and display active jobs for freelancer
    async function fetchActiveJobs() {
        if (!userId) return;
        try {
            const res = await fetch(`/api/jobs/active-details?freelancerId=${userId}`, { headers });
            const jobs = await res.json();
            const activeJobsSection = document.getElementById('activeJobsSection');
            if (activeJobsSection) {
                if (Array.isArray(jobs) && jobs.length > 0) {
                    activeJobsSection.innerHTML = jobs.map(job => `
                        <div class="job-card active-job-card">
                            <div class="job-title">${job.title}</div>
                            <div class="job-budget"><b>Budget:</b> $${job.budget}</div>
                            <div class="job-timeline"><b>Timeline:</b> ${job.timeline} days</div>
                            <div class="job-description">${job.description}</div>
                            <div class="job-employer"><b>Employer:</b> ${job.employerName}</div>
                        </div>
                    `).join('');
                } else {
                    activeJobsSection.innerHTML = '<div style="text-align:center;color:#888;font-size:1.1em;margin:24px 0;">No Active Jobs</div>';
                }
            }
        } catch (err) {
            const activeJobsSection = document.getElementById('activeJobsSection');
            if (activeJobsSection) activeJobsSection.innerHTML = '<div>Error loading active jobs</div>';
        }
    }
    fetchActiveJobs();

    // Handle image upload
    const uploadBtn = document.getElementById('uploadBtn');
    const imageUpload = document.getElementById('imageUpload');
    uploadBtn.addEventListener('click', () => imageUpload.click());
    imageUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        formData.append('userId', userId);
        formData.append('userType', userType);
        try {
            const res = await fetch('/api/profile/upload-image', {
                method: 'POST',
                headers: headers,
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                if (document.getElementById('profileImage')) document.getElementById('profileImage').src = data.profileImageUrl;
            }
        } catch (err) {
            // Optionally show error
        }
    });

    // Home button
    document.getElementById('homeBtn').addEventListener('click', () => {
        window.location.href = 'freelancer-home.html';
    });

    // --- GIGS MANAGEMENT ---
    let currentUserId = userId; // userId is already set from URL params

    // Elements
    const gigsContainer = document.getElementById('gigsContainer');
    const addGigBtn = document.getElementById('addGigBtn');
    const gigModal = document.getElementById('gigModal');
    const closeGigModal = document.getElementById('closeGigModal');
    const gigForm = document.getElementById('gigForm');
    const gigModalTitle = document.getElementById('gigModalTitle');
    const gigFormMsg = document.getElementById('gigFormMsg');

    // Open modal for add
    addGigBtn.addEventListener('click', () => {
        gigModalTitle.textContent = 'Add Gig';
        gigForm.reset();
        document.getElementById('gigId').value = '';
        gigFormMsg.textContent = '';
        gigModal.classList.add('show');
    });
    // Close modal
    closeGigModal.addEventListener('click', () => {
        gigModal.classList.remove('show');
    });
    window.addEventListener('click', (e) => {
        if (e.target === gigModal) gigModal.classList.remove('show');
    });

    // Fetch and display gigs
    async function fetchGigs() {
        gigsContainer.innerHTML = '<div>Loading gigs...</div>';
        try {
            const res = await fetch(`/api/gigs/user/${currentUserId}`);
            const gigs = await res.json();
            if (Array.isArray(gigs) && gigs.length > 0) {
                gigsContainer.innerHTML = gigs.map(gig => `
                    <div class="gig-card">
                        <div class="gig-title">${gig.title}</div>
                        <div class="gig-category">${gig.category}</div>
                        <div class="gig-description">${gig.description}</div>
                        <div class="gig-price">$${gig.price}</div>
                        <button class="edit-gig-btn" data-id="${gig._id}">Edit</button>
                    </div>
                `).join('');
            } else {
                gigsContainer.innerHTML = '<div>No gigs found.</div>';
            }
        } catch (err) {
            gigsContainer.innerHTML = '<div style="color:#d32f2f">Failed to load gigs.</div>';
        }
    }

    // Handle Add/Edit gig form submit
    gigForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        gigFormMsg.textContent = '';
        const gigId = document.getElementById('gigId').value;
        const title = document.getElementById('gigTitle').value.trim();
        const description = document.getElementById('gigDescription').value.trim();
        const price = document.getElementById('gigPrice').value;
        const category = document.getElementById('gigCategory').value.trim();
        const payload = { title, description, price, category, userId: currentUserId };
        try {
            let res, data;
            if (gigId) {
                // Edit
                res = await fetch(`/api/gigs/${gigId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                data = await res.json();
                if (res.ok) {
                    gigFormMsg.style.color = '#388e3c';
                    gigFormMsg.textContent = 'Gig updated successfully!';
                    fetchGigs();
                    setTimeout(() => gigModal.classList.remove('show'), 900);
                } else {
                    gigFormMsg.style.color = '#d32f2f';
                    gigFormMsg.textContent = data.message || 'Failed to update gig.';
                }
            } else {
                // Add
                res = await fetch('/api/gigs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                data = await res.json();
                if (res.ok) {
                    gigFormMsg.style.color = '#388e3c';
                    gigFormMsg.textContent = 'Gig added successfully!';
                    fetchGigs();
                    setTimeout(() => gigModal.classList.remove('show'), 900);
                } else {
                    gigFormMsg.style.color = '#d32f2f';
                    gigFormMsg.textContent = data.message || 'Failed to add gig.';
                }
            }
        } catch (err) {
            gigFormMsg.style.color = '#d32f2f';
            gigFormMsg.textContent = 'An error occurred.';
        }
    });

    // Handle Edit button click (event delegation)
    gigsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-gig-btn')) {
            const gigId = e.target.getAttribute('data-id');
            // Find gig data from DOM (or refetch if needed)
            fetch(`/api/gigs/user/${currentUserId}`)
                .then(res => res.json())
                .then(gigs => {
                    const gig = gigs.find(g => g._id === gigId);
                    if (gig) {
                        gigModalTitle.textContent = 'Edit Gig';
                        document.getElementById('gigId').value = gig._id;
                        document.getElementById('gigTitle').value = gig.title;
                        document.getElementById('gigDescription').value = gig.description;
                        document.getElementById('gigPrice').value = gig.price;
                        document.getElementById('gigCategory').value = gig.category;
                        gigFormMsg.textContent = '';
                        gigModal.classList.add('show');
                    }
                });
        }
    });

    // Initial fetch
    if (currentUserId) fetchGigs();

    // --- PROFILE EDIT MODAL ---
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeEditProfileModal = document.getElementById('closeEditProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');
    const editProfileMsg = document.getElementById('editProfileMsg');

    // Open modal and pre-fill form
    editProfileBtn.addEventListener('click', () => {
        document.getElementById('editProfileName').value = document.getElementById('profileName').textContent;
        document.getElementById('editProfileAbout').value = document.getElementById('about').textContent;
        document.getElementById('editProfileSkills').value = document.getElementById('skills').textContent;
        document.getElementById('editProfilePortfolio').value = document.getElementById('portfolio').textContent;
        // Pre-fill experience
        const expText = document.getElementById('profileExperience').textContent;
        let expVal = '';
        if (expText.includes('Experience:')) {
            const match = expText.match(/Experience: (\d+) years/);
            if (match) expVal = match[1];
        }
        document.getElementById('editProfileExperience').value = expVal;
        editProfileMsg.textContent = '';
        editProfileModal.classList.add('show');
    });

    // Close modal
    closeEditProfileModal.addEventListener('click', () => {
        editProfileModal.classList.remove('show');
    });
    window.addEventListener('click', (e) => {
        if (e.target === editProfileModal) editProfileModal.classList.remove('show');
    });

    // Handle form submit
    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        editProfileMsg.textContent = '';
        const name = document.getElementById('editProfileName').value.trim();
        const about = document.getElementById('editProfileAbout').value.trim();
        const skills = document.getElementById('editProfileSkills').value.trim();
        const portfolio = document.getElementById('editProfilePortfolio').value.trim();
        let experience = document.getElementById('editProfileExperience').value;
        experience = experience === '' ? 0 : parseInt(experience, 10);
        if (isNaN(experience) || experience < 0) experience = 0;
        try {
            const res = await fetch(`/api/profile/${userType}/${userId}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({
                    username: name,
                    profile: about,
                    skills: skills,
                    portfolio: portfolio,
                    experience: experience
                })
            });
            const data = await res.json();
            if (res.ok) {
                editProfileMsg.style.color = '#388e3c';
                editProfileMsg.textContent = 'Profile updated!';
                // Update UI
                if (document.getElementById('profileName')) document.getElementById('profileName').textContent = name;
                if (document.getElementById('about')) document.getElementById('about').textContent = about;
                if (document.getElementById('skills')) document.getElementById('skills').textContent = skills;
                if (document.getElementById('portfolio')) document.getElementById('portfolio').textContent = portfolio;
                if (document.getElementById('profileExperience')) document.getElementById('profileExperience').textContent = `Experience: ${experience} years`;
                // Confirmation toast
                showToast('Experience updated successfully');
                setTimeout(() => editProfileModal.classList.remove('show'), 900);
            } else {
                editProfileMsg.style.color = '#d32f2f';
                editProfileMsg.textContent = data.message || 'Failed to update profile.';
            }
        } catch (err) {
            editProfileMsg.style.color = '#d32f2f';
            editProfileMsg.textContent = 'An error occurred.';
        }
    });

    // Load chat sessions for messages section
    async function loadMessagesSection() {
        try {
            const response = await fetch('/api/chat/sessions', {
                headers: headers
            });
            const chats = await response.json();
            renderMessagesSection(chats);
        } catch (error) {
            console.error('Error loading messages section:', error);
        }
    }

    function renderMessagesSection(chats) {
        const messagesList = document.getElementById('messagesList');
        messagesList.innerHTML = '';
        // Show up to 2 chat partners
        if (!chats || chats.length === 0) {
            messagesList.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:120px;width:100%;color:#888;font-size:1.1em;">No messages received yet.</div>';
            return;
        }
        chats.slice(0, 2).forEach(chat => {
            const partner = chat.participants.find(p => p._id !== getCurrentUserId());
            if (!partner) return;
            const card = document.createElement('div');
            card.className = 'message-card';
            card.innerHTML = `
                <div class="message-card-name">${partner.username}</div>
                <button class="message-btn">Message</button>
            `;
            card.querySelector('.message-btn').onclick = () => {
                window.location.href = `/chat.html?chatId=${chat._id}`;
            };
            messagesList.appendChild(card);
        });
    }

    function getCurrentUserId() {
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    }

    function getCurrentUserType() {
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userType;
    }

    loadMessagesSection();

    // Connect button logic (ensure correct freelancerId is used)
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            try {
                const freelancerId = userId; // Always use the profile's userId from URL
                const response = await fetch('/api/chat/session', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ freelancerId })
                });

                const chat = await response.json();
                if (response.ok) {
                    window.location.href = `/chat.html?chatId=${chat._id}`;
                }
            } catch (error) {
                console.error('Error creating chat session:', error);
            }
        });
    }

    if (getCurrentUserType() !== 'employer') {
        if (connectBtn) connectBtn.style.display = 'none';
    }

    // Fetch and display reviews and average rating
    async function fetchReviewsAndRating() {
        if (!userId) return;
        try {
            const res = await fetch(`/api/reviews/${userId}`);
            const reviews = await res.json();
            // Set average rating
            let avg = 0;
            if (Array.isArray(reviews) && reviews.length > 0) {
                avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
            }
            if (document.getElementById('averageRating')) document.getElementById('averageRating').textContent = avg.toFixed(1);
            // Render reviews
            const reviewsList = document.getElementById('reviewsList');
            if (reviewsList) {
                if (reviews.length === 0) {
                    reviewsList.innerHTML = '<div style="text-align:center;color:#888;font-size:1.1em;margin:24px 0;">No reviews yet.</div>';
                } else {
                    reviewsList.innerHTML = reviews.map(r => {
                        const employerName = r.employerId?.companyName || r.employerId?.username || 'Anonymous';
                        const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
                        const date = new Date(r.timestamp).toLocaleDateString();
                        return `<div class="review-card">
                            <div class="review-header">
                                <span class="review-employer">${employerName}</span>
                                <span class="review-stars">${stars}</span>
                                <span class="review-date">${date}</span>
                            </div>
                            <div class="review-text">${r.reviewText}</div>
                        </div>`;
                    }).join('');
                }
            }
        } catch (err) {
            const reviewsList = document.getElementById('reviewsList');
            if (reviewsList) reviewsList.innerHTML = '<div style="text-align:center;color:#888;font-size:1.1em;margin:24px 0;">No reviews yet.</div>';
        }
    }
    fetchReviewsAndRating();

    // At the end of the DOMContentLoaded handler, add:
    window.addEventListener('storage', (event) => {
        if (event.key === 'refreshFreelancerProfile') {
            fetchUserProfile();
            fetchActiveJobs();
            fetchReviewsAndRating();
        }
    });

    // Toast function
    function showToast(message) {
        let toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.classList.add('show'); }, 10);
        setTimeout(() => { toast.classList.remove('show'); toast.remove(); }, 2100);
    }
}); 