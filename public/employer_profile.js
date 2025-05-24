document.addEventListener('DOMContentLoaded', () => {
    // Get userId and userType from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const userType = urlParams.get('type');
    const token = localStorage.getItem('token');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

    // Fetch and display employer info
    async function fetchEmployerProfile() {
        if (!userId || !userType) return;
        try {
            const res = await fetch(`/api/profile/${userType}/${userId}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            if (res.ok) {
                const user = await res.json();
                document.getElementById('profileName').textContent = user.username || '';
                document.getElementById('companyName').textContent = user.companyName || '';
                document.getElementById('about').textContent = user.companyDescription || 'No company description provided';
                document.getElementById('companySize').textContent = user.companySize || 'Not specified';
                document.getElementById('industry').textContent = user.industry || 'Not specified';
                document.getElementById('location').textContent = user.location || 'Not specified';
                document.getElementById('activeJobs').textContent = user.activeJobs || 0;
                document.getElementById('totalHires').textContent = user.totalHires || 0;
                document.getElementById('totalProjects').textContent = user.totalProjects || 0;
                document.getElementById('activeFreelancers').textContent = user.activeFreelancers || 0;
                document.getElementById('averageRating').textContent = user.averageRating || '0.0';
                document.getElementById('activeJobsList').textContent = user.activeJobsList || 'No active job postings';
                document.getElementById('companyReviews').textContent = user.companyReviews || 'No reviews yet';
                if (user.profileImageUrl) {
                    document.getElementById('profileImage').src = user.profileImageUrl;
                }
                console.log('Fetched user:', user);
                document.getElementById('companyNameHeading').textContent = user.companyName || '';
                console.log('Setting companyNameHeading:', user.companyName);
            }
        } catch (err) {
            // Optionally show error
        }
    }
    fetchEmployerProfile();

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
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                document.getElementById('profileImage').src = data.profileImageUrl;
            }
        } catch (err) {
            // Optionally show error
        }
    });

    // Home button
    document.getElementById('homeBtn').addEventListener('click', () => {
        window.location.href = 'employer-home.html';
    });

    // --- PROFILE EDIT MODAL ---
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeEditProfileModal = document.getElementById('closeEditProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');
    const editProfileMsg = document.getElementById('editProfileMsg');

    // Open modal and pre-fill form
    editProfileBtn.addEventListener('click', () => {
        document.getElementById('editProfileName').value = document.getElementById('companyName').textContent;
        document.getElementById('editProfileAbout').value = document.getElementById('about').textContent;
        document.getElementById('editProfileSize').value = document.getElementById('companySize').textContent;
        document.getElementById('editProfileIndustry').value = document.getElementById('industry').textContent;
        document.getElementById('editProfileLocation').value = document.getElementById('location').textContent;
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
        const companyName = document.getElementById('editProfileName').value.trim();
        const companyDescription = document.getElementById('editProfileAbout').value.trim();
        const companySize = document.getElementById('editProfileSize').value.trim();
        const industry = document.getElementById('editProfileIndustry').value.trim();
        const location = document.getElementById('editProfileLocation').value.trim();

        try {
            const res = await fetch(`/api/profile/${userType}/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    companyName,
                    companyDescription,
                    companySize,
                    industry,
                    location
                })
            });
            const data = await res.json();
            if (res.ok) {
                editProfileMsg.style.color = '#388e3c';
                editProfileMsg.textContent = 'Profile updated!';
                // Update UI
                document.getElementById('companyName').textContent = companyName;
                document.getElementById('about').textContent = companyDescription;
                document.getElementById('companySize').textContent = companySize;
                document.getElementById('industry').textContent = industry;
                document.getElementById('location').textContent = location;
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

    // --- JOBS MANAGEMENT ---
    function getUserIdFromToken() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId;
        } catch (e) {
            return null;
        }
    }
    const currentEmployerId = getUserIdFromToken();

    // Elements
    const jobsContainer = document.getElementById('jobsContainer');
    const addJobBtn = document.getElementById('addJobBtn');
    const jobModal = document.getElementById('jobModal');
    const closeJobModal = document.getElementById('closeJobModal');
    const jobForm = document.getElementById('jobForm');
    const jobModalTitle = document.getElementById('jobModalTitle');
    const jobFormMsg = document.getElementById('jobFormMsg');

    // Open modal for add
    addJobBtn.addEventListener('click', () => {
        jobModalTitle.textContent = 'Add Job';
        jobForm.reset();
        document.getElementById('jobId').value = '';
        jobFormMsg.textContent = '';
        jobModal.querySelector('.save-job-btn').textContent = 'Save';
        jobModal.classList.add('show');
    });
    // Close modal
    closeJobModal.addEventListener('click', () => {
        jobModal.classList.remove('show');
    });
    window.addEventListener('click', (e) => {
        if (e.target === jobModal) jobModal.classList.remove('show');
    });

    // Fetch and display jobs
    async function fetchJobs() {
        jobsContainer.innerHTML = '<div>Loading jobs...</div>';
        try {
            const res = await fetch(`/api/jobs/${currentEmployerId}`, {
                headers: authHeaders
            });
            const jobs = await res.json();
            if (Array.isArray(jobs) && jobs.length > 0) {
                jobsContainer.innerHTML = jobs.map(job => `
                    <div class="job-card" data-jobid="${job._id}">
                        <div class="job-title">${job.title}</div>
                        <div class="job-budget">$${job.budget}</div>
                        <div class="job-timeline">Timeline: ${job.timeline} days</div>
                        <div class="job-description">${job.description}</div>
                        ${job.additional_info ? `<div class="job-additional-info">${job.additional_info}</div>` : ''}
                        <div class="applicants-section" id="applicants-${job._id}" style="display:none;"></div>
                        <button class="edit-job-btn" data-id="${job._id}">Edit</button>
                    </div>
                `).join('');

                // Add click event to job cards to fetch and show applicants
                document.querySelectorAll('.job-card').forEach(card => {
                    card.addEventListener('click', async function(e) {
                        // Prevent edit button from triggering this
                        if (e.target.classList.contains('edit-job-btn')) return;
                        const jobId = this.getAttribute('data-jobid');
                        const applicantsSection = document.getElementById(`applicants-${jobId}`);
                        if (applicantsSection.style.display === 'block') {
                            applicantsSection.style.display = 'none';
                            applicantsSection.innerHTML = '';
                            return;
                        }
                        applicantsSection.innerHTML = 'Loading applicants...';
                        applicantsSection.style.display = 'block';
                        
                        try {
                            const res = await fetch(`/api/jobs/${jobId}/applicants`, {
                                headers: authHeaders
                            });
                            const applicants = await res.json();
                            
                            if (Array.isArray(applicants) && applicants.length > 0) {
                                applicantsSection.innerHTML = `
                                    <h3>Applicants</h3>
                                    <div class="applicants-list">
                                        ${applicants.map(applicant => `
                                            <div class="applicant-card" data-applicant-id="${applicant._id}">
                                                <div class="applicant-info">
                                                    <h4>${(applicant.freelancerId && applicant.freelancerId.username) || applicant.username || 'N/A'}</h4>
                                                    <p>Domain: ${(applicant.freelancerId && applicant.freelancerId.domain) || applicant.domain || 'N/A'}</p>
                                                    <p>Skills: ${(applicant.freelancerId && applicant.freelancerId.skills) || applicant.skills || 'N/A'}</p>
                                                </div>
                                                <button class="accept-btn" data-job-id="${jobId}" data-freelancer-id="${(applicant.freelancerId && applicant.freelancerId._id) || ''}">
                                                    Accept
                                                </button>
                                            </div>
                                        `).join('')}
                                    </div>
                                `;

                                // Add click handlers for accept buttons
                                applicantsSection.querySelectorAll('.accept-btn').forEach(btn => {
                                    btn.addEventListener('click', async (e) => {
                                        e.stopPropagation();
                                        const jobId = btn.getAttribute('data-job-id');
                                        const freelancerId = btn.getAttribute('data-freelancer-id');
                                        await handleAcceptApplicant(jobId, freelancerId);
                                    });
                                });
                            } else {
                                applicantsSection.innerHTML = '<p>No applicants yet</p>';
                            }
                        } catch (err) {
                            applicantsSection.innerHTML = '<p>Error loading applicants</p>';
                        }
                    });
                });
            } else {
                jobsContainer.innerHTML = '<div>No jobs posted yet</div>';
            }
        } catch (err) {
            jobsContainer.innerHTML = '<div>Error loading jobs</div>';
        }
    }

    // Handle accepting an applicant
    async function handleAcceptApplicant(jobId, freelancerId) {
        try {
            const res = await fetch('/api/jobs/accept-applicant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ jobId, freelancerId })
            });

            if (res.ok) {
                const result = await res.json();
                // Move applicant to active workers
                addToActiveWorkers(result.worker);
                // Remove job from jobs list
                const jobCard = document.querySelector(`.job-card[data-jobid="${jobId}"]`);
                if (jobCard) {
                    jobCard.remove();
                }
                // Update active jobs count
                const activeJobsElement = document.getElementById('activeJobs');
                if (activeJobsElement) {
                    const currentCount = parseInt(activeJobsElement.textContent) || 0;
                    activeJobsElement.textContent = currentCount + 1;
                }
                // Show success message
                alert('Freelancer accepted successfully!');
            } else {
                const error = await res.json();
                alert(error.message || 'Error accepting applicant');
            }
        } catch (err) {
            console.error('Error accepting applicant:', err);
            alert('Error accepting applicant');
        }
    }

    // Add worker to active workers section
    function addToActiveWorkers(worker) {
        const activeWorkersContainer = document.getElementById('activeWorkersContainer');
        // Remove 'No active workers' message if present
        if (activeWorkersContainer.textContent.includes('No active workers')) {
            activeWorkersContainer.innerHTML = '';
        }
        const workerCard = document.createElement('div');
        workerCard.className = 'worker-card';
        workerCard.innerHTML = `
            <h3>${worker.username}</h3>
            <div class="worker-info">
                <p><strong>Domain:</strong> ${worker.domain}</p>
                <p><strong>Skills:</strong> ${worker.skills}</p>
                <p><strong>Job:</strong> ${worker.currentJob}</p>
            </div>
            <div class="worker-actions">
                <button class="complete-work-btn" data-worker-id="${worker._id}" data-job-id="${worker.jobId}">
                    Mark Work as Completed
                </button>
            </div>
        `;

        // Add click handler for complete work button
        const completeBtn = workerCard.querySelector('.complete-work-btn');
        completeBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to mark this job as completed?')) {
                await handleCompleteWork(worker._id, worker.jobId);
            }
        });

        activeWorkersContainer.appendChild(workerCard);
    }

    // --- Review Modal Logic ---
    const reviewModal = document.getElementById('reviewModal');
    const closeReviewModal = document.getElementById('closeReviewModal');
    const reviewForm = document.getElementById('reviewForm');
    const reviewFormMsg = document.getElementById('reviewFormMsg');
    const starRatingDiv = document.getElementById('starRating');
    let reviewJobId = null;
    let reviewWorkerId = null;
    let selectedRating = 0;

    function showReviewModal(workerId, jobId) {
        reviewJobId = jobId;
        reviewWorkerId = workerId;
        reviewForm.reset();
        reviewFormMsg.textContent = '';
        selectedRating = 0;
        renderStars(0);
        reviewModal.classList.add('show');
    }
    function hideReviewModal() {
        reviewModal.classList.remove('show');
    }
    closeReviewModal.addEventListener('click', hideReviewModal);
    window.addEventListener('click', (e) => {
        if (e.target === reviewModal) hideReviewModal();
    });
    function renderStars(rating) {
        starRatingDiv.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'star' + (i <= rating ? ' filled' : '');
            star.textContent = '★';
            star.style.cursor = 'pointer';
            star.onclick = () => {
                selectedRating = i;
                renderStars(i);
            };
            starRatingDiv.appendChild(star);
        }
    }
    renderStars(0);
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        reviewFormMsg.textContent = '';
        const reviewText = document.getElementById('reviewText').value.trim();
        if (selectedRating < 1 || selectedRating > 5) {
            reviewFormMsg.textContent = 'Please select a rating (1-5 stars).';
            return;
        }
        if (!reviewText || reviewText.length > 500) {
            reviewFormMsg.textContent = 'Please enter a review (max 500 chars).';
            return;
        }
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                    freelancerId: reviewWorkerId,
                    employerId: userId,
                    jobId: reviewJobId,
                    rating: selectedRating,
                    reviewText
                })
            });
            const data = await res.json();
            if (res.ok) {
                reviewFormMsg.style.color = '#388e3c';
                reviewFormMsg.textContent = 'Thank you for rating the freelancer!';
                setTimeout(hideReviewModal, 1200);
            } else {
                reviewFormMsg.style.color = '#d32f2f';
                reviewFormMsg.textContent = data.message || 'Failed to submit review.';
            }
        } catch (err) {
            reviewFormMsg.style.color = '#d32f2f';
            reviewFormMsg.textContent = 'An error occurred.';
        }
    });
    // --- Show review modal after marking work as completed ---
    async function handleCompleteWork(workerId, jobId) {
        try {
            const res = await fetch('/api/jobs/complete-work', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ workerId, jobId })
            });
            if (res.ok) {
                // Remove worker card
                const workerCard = document.querySelector(`.worker-card .complete-work-btn[data-worker-id="${workerId}"]`).closest('.worker-card');
                if (workerCard) {
                    workerCard.remove();
                }
                window.localStorage.setItem('refreshFreelancerProfile', Date.now());
                // Show review modal
                showReviewModal(workerId, jobId);
            } else {
                const error = await res.json();
                alert(error.message || 'Error completing work');
            }
        } catch (err) {
            alert('Error completing work');
        }
    }

    // Handle Add/Edit job form submit
    jobForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        jobFormMsg.textContent = '';
        const jobId = document.getElementById('jobId').value;
        const title = document.getElementById('jobTitle').value.trim();
        const description = document.getElementById('jobDescription').value.trim();
        const budget = document.getElementById('jobBudget').value;
        const timeline = document.getElementById('jobTimeline').value;
        const additional_info = document.getElementById('jobAdditionalInfo').value.trim();
        const category = document.getElementById('jobCategory').value.trim();
        const payload = { title, description, budget, timeline, additional_info, category, employer_id: currentEmployerId };
        try {
            let res, data;
            if (jobId) {
                // Edit
                res = await fetch(`/api/jobs/${jobId}`, {
                    method: 'PUT',
                    headers: { ...authHeaders, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                data = await res.json();
                if (res.ok) {
                    jobFormMsg.style.color = '#388e3c';
                    jobFormMsg.textContent = 'Job updated successfully!';
                    fetchJobs();
                    setTimeout(() => jobModal.classList.remove('show'), 900);
                } else {
                    jobFormMsg.style.color = '#d32f2f';
                    jobFormMsg.textContent = data.message || 'Failed to update job.';
                }
            } else {
                // Add
                res = await fetch('/api/jobs', {
                    method: 'POST',
                    headers: { ...authHeaders, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                data = await res.json();
                if (res.ok) {
                    jobFormMsg.style.color = '#388e3c';
                    jobFormMsg.textContent = 'Job added successfully!';
                    fetchJobs();
                    setTimeout(() => jobModal.classList.remove('show'), 900);
                } else {
                    jobFormMsg.style.color = '#d32f2f';
                    jobFormMsg.textContent = data.message || 'Failed to add job.';
                }
            }
        } catch (err) {
            jobFormMsg.style.color = '#d32f2f';
            jobFormMsg.textContent = 'An error occurred.';
        }
    });

    // Handle Edit button click (event delegation)
    jobsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-job-btn')) {
            const jobId = e.target.getAttribute('data-id');
            // Find job data from DOM (or refetch if needed)
            fetch(`/api/jobs/${currentEmployerId}`, {
                headers: authHeaders
            })
                .then(res => res.json())
                .then(jobs => {
                    const job = jobs.find(j => j._id === jobId);
                    if (job) {
                        jobModalTitle.textContent = 'Edit Job';
                        document.getElementById('jobId').value = job._id;
                        document.getElementById('jobTitle').value = job.title;
                        document.getElementById('jobDescription').value = job.description;
                        document.getElementById('jobBudget').value = job.budget;
                        document.getElementById('jobTimeline').value = job.timeline;
                        document.getElementById('jobAdditionalInfo').value = job.additional_info || '';
                        document.getElementById('jobCategory').value = job.category || '';
                        jobFormMsg.textContent = '';
                        jobModal.querySelector('.save-job-btn').textContent = 'Update';
                        jobModal.classList.add('show');
                    }
                });
        }
    });

    // Initial fetch
    if (currentEmployerId) {
        fetchJobs();
        // Fetch active workers
        fetchActiveWorkers();
    }

    // Fetch active workers
    async function fetchActiveWorkers() {
        const activeWorkersContainer = document.getElementById('activeWorkersContainer');
        try {
            const res = await fetch(`/api/employer/${currentEmployerId}/active-workers`, {
                headers: authHeaders
            });
            const workers = await res.json();
            
            if (Array.isArray(workers) && workers.length > 0) {
                workers.forEach(worker => addToActiveWorkers(worker));
            } else {
                activeWorkersContainer.innerHTML = '<div>No active workers</div>';
            }
        } catch (err) {
            activeWorkersContainer.innerHTML = '<div>Error loading active workers</div>';
        }
    }
}); 