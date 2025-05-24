document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const userType = urlParams.get('type');
    if (!userId || userType !== 'employer') return;

    try {
        const res = await fetch(`/api/profile/employer/${userId}`);
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
            document.getElementById('companyReviews').textContent = user.companyReviews || 'No reviews yet';
            document.getElementById('companyNameHeading').textContent = user.companyName || '';
            if (user.profileImageUrl) {
                document.getElementById('profileImage').src = user.profileImageUrl;
            }
        }
    } catch (err) {
        // Optionally show error
    }
}); 