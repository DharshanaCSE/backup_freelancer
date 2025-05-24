document.addEventListener('DOMContentLoaded', () => {
    // Attach click event to the existing Back to Home button
    const backBtn = document.getElementById('backToHomeBtn');
    if (backBtn) {
        backBtn.onclick = () => {
            window.location.href = '/employer-home.html';
        };
    }

    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const domainFilter = document.getElementById('domainFilter');
    const experienceFilter = document.getElementById('experienceFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const freelancerGrid = document.querySelector('.freelancer-grid');

    // Function to create freelancer card
    function createFreelancerCard(freelancer) {
        return `
            <div class="freelancer-card">
                <div class="freelancer-name">${freelancer.username}</div>
                <div class="freelancer-domain">${freelancer.domain || ''}</div>
                <div class="freelancer-meta">
                    <span>${freelancer.jobsCompleted || 0} Jobs Done</span>
                    <span>${freelancer.rating || 0} Rating</span>
                </div>
                <a class="view-profile-btn" href="freelancer_view.html?id=${freelancer._id}&type=freelancer">
                    View Profile
                </a>
            </div>
        `;
    }

    // Function to fetch and display freelancers
    async function fetchFreelancers() {
        try {
            const queryParams = new URLSearchParams({
                query: searchInput.value,
                domain: domainFilter.value,
                experience: experienceFilter.value,
                rating: ratingFilter.value
            });

            const response = await fetch(`/api/freelancers/search?${queryParams}`);
            if (!response.ok) throw new Error('Failed to fetch freelancers');
            
            const freelancers = await response.json();
            
            // Clear and update the grid
            freelancerGrid.innerHTML = freelancers.length ? 
                freelancers.map(createFreelancerCard).join('') :
                '<p class="no-results">No freelancers found matching your criteria.</p>';
        } catch (error) {
            console.error('Error:', error);
            freelancerGrid.innerHTML = '<p class="error">Failed to load freelancers. Please try again.</p>';
        }
    }

    // Event listeners
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        fetchFreelancers();
    });

    // Add change event listeners to filters
    [domainFilter, experienceFilter, ratingFilter].forEach(filter => {
        filter.addEventListener('change', fetchFreelancers);
    });

    // Initial load
    fetchFreelancers();
}); 