document.addEventListener('DOMContentLoaded', () => {
    const socialFeed = document.getElementById('social-feed');
    const filterChips = document.querySelectorAll('.filter-chip');

    // Mock Social Data
    const mockSocialPosts = [
        {
            id: 'S1',
            platform: 'twitter',
            user: '@RajeshHyd',
            avatar: 'R',
            text: "Terrible water logging at Jubilee Hills Checkpost after just 30 mins of rain. GHMC please look into this. #HyderabadRains #Drainage",
            time: '2 hours ago',
            ai_category: 'Water & Drainage',
            ai_severity: 'High',
            ai_location: 'Jubilee Hills',
            ai_summary: 'Major water logging at primary junction due to drainage blockage.'
        },
        {
            id: 'S2',
            platform: 'instagram',
            user: 'city_vibes_24',
            avatar: 'C',
            text: "Look at the state of this park in Banjara Hills. Garbage everywhere and no maintenance for months. Who is responsible? #CleanCity #Hyderabad",
            time: '5 hours ago',
            ai_category: 'Municipal Services',
            ai_severity: 'Medium',
            ai_location: 'Banjara Hills Park',
            ai_summary: 'Waste management failure and lack of landscape maintenance.'
        },
        {
            id: 'S3',
            platform: 'twitter',
            user: '@SoftwareEngg_H',
            avatar: 'S',
            text: "Third power cut today in Gachibowli. Work from home is becoming impossible. @TSSPDCL when will this be fixed?",
            time: '1 hour ago',
            ai_category: 'Electricity',
            ai_severity: 'Medium',
            ai_location: 'Gachibowli',
            ai_summary: 'Frequent power outages affecting work-from-home residents.'
        },
        {
            id: 'S4',
            platform: 'facebook',
            user: 'Anita Sharma',
            avatar: 'A',
            text: "Street lights are not working on the main road of Kondapur for a week. It is getting very unsafe for women to walk at night.",
            time: '10 hours ago',
            ai_category: 'Electricity / Safety',
            ai_severity: 'High',
            ai_location: 'Kondapur Main Road',
            ai_summary: 'Infrastructure failure leading to safety concerns in poorly lit areas.'
        },
        {
            id: 'S5',
            platform: 'twitter',
            user: '@TrafficPolice_Fan',
            avatar: 'T',
            text: "Huge pothole at the turn near IKEA. I saw 3 bikes almost skid today. Fix it before someone gets hurt! #SafetyFirst",
            time: '30 mins ago',
            ai_category: 'Roads & Transport',
            ai_severity: 'Critical',
            ai_location: 'IKEA Junction',
            ai_summary: 'Hazardous pothole on high-traffic turn causing immediate safety risk.'
        }
    ];

    function renderFeed(platform = 'all') {
        socialFeed.innerHTML = '';

        const filteredPosts = platform === 'all'
            ? mockSocialPosts
            : mockSocialPosts.filter(post => post.platform === platform);

        if (filteredPosts.length === 0) {
            socialFeed.innerHTML = '<div class="loading-state"><p>No social grievances found for this platform.</p></div>';
            return;
        }

        filteredPosts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'social-card fade-in visible';
            
            const platformClass = `platform-${post.platform}`;
            let platformLogo = '';
            if (post.platform === 'twitter') platformLogo = '<img src="assets/x.jpg" class="card-platform-icon">';
            else if (post.platform === 'instagram') platformLogo = '<img src="assets/instagram.jpg" class="card-platform-icon">';
            else if (post.platform === 'facebook') platformLogo = '<img src="assets/facebook.png" class="card-platform-icon">';
            
            card.innerHTML = `
                <div class="card-platform-bar ${platformClass}">
                    <span style="display:flex; align-items:center; gap:8px;">${platformLogo} ${post.platform.toUpperCase()}</span>
                    <span>🔴 LIVE AI MONITOR</span>
                </div>
                <div class="card-content">
                    <div class="user-info">
                        <div class="user-avatar">${post.avatar}</div>
                        <div>
                            <div class="username">${post.user}</div>
                            <div class="timestamp">${post.time}</div>
                        </div>
                    </div>
                    <p class="post-text">"${post.text}"</p>
                    
                    <div class="ai-extraction">
                        <div class="extraction-header">
                            <span>✨ AI EXTRACTION</span>
                        </div>
                        <div class="extracted-data">
                            <div class="data-item">
                                <span class="data-label">CATEGORY</span>
                                <span class="data-value">${post.ai_category}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">SEVERITY</span>
                                <span class="data-value" style="color: ${getSeverityColor(post.ai_severity)}">${post.ai_severity}</span>
                            </div>
                            <div class="data-item" style="grid-column: span 2;">
                                <span class="data-label">LOCATION</span>
                                <span class="data-value">📍 ${post.ai_location}</span>
                            </div>
                            <div class="data-item" style="grid-column: span 2;">
                                <span class="data-label">SUMMARY</span>
                                <span class="data-value">${post.ai_summary}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn-convert" onclick="convertToOfficial('${post.id}')">Convert to Official Complaint</button>
                    <button class="btn-view-source">View Source</button>
                </div>
            `;
            socialFeed.appendChild(card);
        });
    }

    function getSeverityColor(severity) {
        switch (severity) {
            case 'Critical': return '#ef4444';
            case 'High': return '#f97316';
            case 'Medium': return '#3b82f6';
            default: return '#6b7280';
        }
    }

    // Filter logic
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // Simulate loading
            socialFeed.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Filtering feed...</p></div>';

            setTimeout(() => {
                renderFeed(chip.dataset.platform);
            }, 600);
        });
    });

    // Initial render
    setTimeout(() => {
        renderFeed();
    }, 1000);
});

function convertToOfficial(id) {
    alert(`Complaint ${id} has been converted to an Official Grievance ID. An officer will be notified.`);
}
