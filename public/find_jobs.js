document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const jobsListContainer = document.getElementById('jobsListContainer');
    let freelancerDomain = null;
    let appliedJobIds = JSON.parse(localStorage.getItem('appliedJobIds') || '[]');

    // Check if user is logged in
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 1. Fetch freelancer info to get domain
    try {
        console.log('Fetching freelancer info...');
        const res = await fetch('/api/freelancer/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('API error:', res.status, errorText);
            throw new Error(`API error: ${res.status}`);
        }
        
            const user = await res.json();
        console.log('Freelancer info:', user);
        
            freelancerDomain = user.domain ? user.domain.trim().toLowerCase() : null;
        console.log('Freelancer domain:', freelancerDomain);
        
        if (freelancerDomain) {
            // Update the header to show the domain
            document.querySelector('.jobs-list-header').textContent = `Find Jobs in ${freelancerDomain}`;
        } else {
            jobsListContainer.innerHTML = '<div style="color:#d32f2f">Please update your domain in your profile to see relevant jobs.</div>';
            return;
        }

        const jobsAppliedElem = document.getElementById('jobsApplied');
        if (jobsAppliedElem) jobsAppliedElem.textContent = user.jobsApplied;
    } catch (err) {
        console.error('Error fetching freelancer info:', err);
        jobsListContainer.innerHTML = '<div style="color:#d32f2f">Error loading your profile. Please try again later.</div>';
        return;
    }

    // 2. Fetch jobs filtered by domain
    let jobs = [];
    try {
        console.log('Fetching jobs for domain:', freelancerDomain);
        const url = `/api/jobs/all?domain=${encodeURIComponent(freelancerDomain)}`;
        console.log('Request URL:', url);
        
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.status === 403) {
            // Token invalid or expired
            window.location.href = '/login.html'; // or show a message
            return;
        }

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error('Error response:', errorData);
            throw new Error(`HTTP error! status: ${res.status}`);
        }

            jobs = await res.json();
        console.log('Fetched jobs:', jobs);
    } catch (err) {
        console.error('Error fetching jobs:', err);
        jobsListContainer.innerHTML = '<div style="color:#d32f2f">Failed to load jobs. Please try again later.</div>';
        return;
    }

    function renderJobs(jobsToRender) {
        if (!Array.isArray(jobsToRender) || jobsToRender.length === 0) {
            jobsListContainer.innerHTML = '<div>No jobs found matching your domain.</div>';
            return;
        }

            jobsListContainer.innerHTML = jobsToRender.map(job => `
                <div class="job-card">
                <div class="job-title">${job.title || 'Untitled Job'}</div>
                <div class="job-budget">$${job.budget || 0}</div>
                <div class="job-timeline">Timeline: ${job.timeline || 0} days</div>
                <div class="job-description">${job.description || 'No description provided'}</div>
                    ${job.additional_info ? `<div class="job-additional-info">${job.additional_info}</div>` : ''}
                <div class="job-employer"><b>Posted by:</b> ${job.employer_id?.companyName || job.employer_id?.username || 'Unknown Employer'}</div>
                <div class="job-actions">
                    <button class="view-employer-btn" data-employer="${job.employer_id?._id || ''}">View Employer Profile</button>
                    <button class="apply-job-btn" data-jobid="${job._id}" ${appliedJobIds.includes(job._id) ? 'disabled' : ''}>${appliedJobIds.includes(job._id) ? 'Applied' : 'Apply'}</button>
                </div>
                </div>
            `).join('');

            // Add click listeners for view profile buttons
            document.querySelectorAll('.view-employer-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const employerId = this.getAttribute('data-employer');
                if (employerId) {
                    window.location.href = `employer_view.html?id=${employerId}&type=employer`;
                }
            });
        });

            // Add click listeners for apply buttons
            document.querySelectorAll('.apply-job-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const jobId = this.getAttribute('data-jobid');
                if (!jobId || appliedJobIds.includes(jobId)) return;
                
                try {
                    const res = await fetch('/api/jobs/apply', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ jobId })
                    });
                    
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }

                    const data = await res.json();
                    appliedJobIds.push(jobId);
                    localStorage.setItem('appliedJobIds', JSON.stringify(appliedJobIds));
                    this.textContent = 'Applied';
                    this.disabled = true;
                    document.getElementById('applicationMsg').textContent = 'Application sent successfully!';
                    setTimeout(() => { document.getElementById('applicationMsg').textContent = ''; }, 2000);
                } catch (err) {
                    console.error('Error applying to job:', err);
                    document.getElementById('applicationMsg').textContent = 'Error applying to job. Please try again.';
                    setTimeout(() => { document.getElementById('applicationMsg').textContent = ''; }, 2000);
                }
            });
        });
    }

    // Initial render
    renderJobs(jobs);

    // Filter input logic
    const jobFilterInput = document.getElementById('jobFilterInput');
    if (jobFilterInput) {
        jobFilterInput.addEventListener('input', function() {
            const val = this.value.trim().toLowerCase();
            if (!val) {
                renderJobs(jobs);
            } else {
                const filtered = jobs.filter(job =>
                    (job.title && job.title.toLowerCase().includes(val)) ||
                    (job.description && job.description.toLowerCase().includes(val)) ||
                    (job.employer_id.companyName && job.employer_id.companyName.toLowerCase().includes(val))
                );
                renderJobs(filtered);
            }
        });
    }
}); 