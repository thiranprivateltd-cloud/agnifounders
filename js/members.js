/**
 * AGNI FOUNDERS - MEMBERS DIRECTORY JAVASCRIPT
 */

document.addEventListener('DOMContentLoaded', () => {
  const membersGrid = document.getElementById('members-grid');
  const searchInput = document.getElementById('member-search');
  const filterCity = document.getElementById('filter-city');
  const filterDomain = document.getElementById('filter-domain');
  const filterTier = document.getElementById('filter-tier');
  const noResults = document.getElementById('no-results');

  // Helper: Get initials from name
  const getInitials = (name) => {
    if (!name) return 'AF';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Helper: Get avatar color class based on initials code
  const getAvatarColorClass = (initials) => {
    const code = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
    const classes = ['avatar-orange', 'avatar-blue', 'avatar-purple', 'avatar-green'];
    return classes[code % classes.length];
  };

  // 1. Load members from LocalStorage
  let members = [];
  try {
    const stored = localStorage.getItem('agni_members');
    if (stored) {
      members = JSON.parse(stored);
    }
  } catch (err) {
    console.error('Error reading members from localStorage:', err);
  }

  // 2. Dynamically Populate City Filter
  if (filterCity) {
    // Get unique cities
    const cities = [...new Set(members.map(m => m.city).filter(Boolean))].sort();
    
    // Reset to just 'All Cities'
    filterCity.innerHTML = '<option value="all">All Cities</option>';
    
    // Add active cities
    cities.forEach(city => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      filterCity.appendChild(option);
    });
  }

  // 3. Render members grid
  const renderMembers = () => {
    if (!membersGrid) return;
    
    membersGrid.innerHTML = '';
    
    if (members.length === 0) {
      if (noResults) {
        noResults.innerHTML = `
          <i data-lucide="users-2" class="no-results-icon" style="color: var(--color-spark);"></i>
          <h3>No active members yet</h3>
          <p>Be the first to join the movement! Go to the membership page to apply.</p>
        `;
        noResults.style.display = 'flex';
      }
      return;
    }

    members.forEach(member => {
      const initials = getInitials(member.name);
      const colorClass = getAvatarColorClass(initials);
      
      const card = document.createElement('article');
      card.className = 'card member-card';
      card.setAttribute('data-city', member.city);
      card.setAttribute('data-domain', member.domain);
      card.setAttribute('data-tier', member.tier);
      
      // Determine startup icon and label
      const isSpark = member.tier === 'Spark';
      const startupIcon = isSpark ? 'lightbulb' : 'rocket';
      const startupText = isSpark ? 'Idea-Stage Explorer' : `<strong>${member.startup}</strong>`;
      
      // Determine tier badge class
      let tierBadgeClass = 'badge-spark';
      if (member.tier === 'Builder') tierBadgeClass = 'badge-builder';
      if (member.tier === 'Founder Pro') tierBadgeClass = 'badge-pro';

      card.innerHTML = `
        <div class="member-header">
          <div class="avatar-circle ${colorClass}">${initials}</div>
          <div class="member-meta-title">
            <h3>${member.name}</h3>
            <p class="member-college">${member.college}</p>
          </div>
        </div>
        <div class="member-body">
          <p class="member-city"><i data-lucide="map-pin"></i> ${member.city}</p>
          <p class="member-startup"><i data-lucide="${startupIcon}"></i> ${startupText}</p>
          <div class="member-tags">
            <span class="domain-tag">${member.domain}</span>
            <span class="tier-tag ${tierBadgeClass}">${member.tier}</span>
          </div>
        </div>
        <div class="member-footer">
          <a href="${member.linkedin}" target="_blank" rel="noopener noreferrer" class="member-linkedin" aria-label="LinkedIn profile"><i data-lucide="linkedin"></i> Connect</a>
        </div>
      `;
      membersGrid.appendChild(card);
    });

    // Initialize Lucide icons on newly created nodes
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  };

  // Run initial render
  renderMembers();

  // 4. Filtering Logic
  const applyFilters = () => {
    const memberCards = document.querySelectorAll('.member-card');
    const searchQuery = searchInput.value.toLowerCase().trim();
    const cityValue = filterCity.value;
    const domainValue = filterDomain.value;
    const tierValue = filterTier.value;
    
    let visibleCount = 0;

    memberCards.forEach(card => {
      const name = card.querySelector('h3').textContent.toLowerCase();
      const college = card.querySelector('.member-college').textContent.toLowerCase();
      const startupElement = card.querySelector('.member-startup');
      const startup = startupElement ? startupElement.textContent.toLowerCase() : '';
      
      const city = card.getAttribute('data-city');
      const domain = card.getAttribute('data-domain');
      const tier = card.getAttribute('data-tier');

      // Check criteria
      const matchesSearch = name.includes(searchQuery) || college.includes(searchQuery) || startup.includes(searchQuery);
      const matchesCity = cityValue === 'all' || city === cityValue;
      const matchesDomain = domainValue === 'all' || domain === domainValue;
      const matchesTier = tierValue === 'all' || tier === tierValue;

      if (matchesSearch && matchesCity && matchesDomain && matchesTier) {
        card.style.display = 'flex';
        card.style.opacity = '1';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Display No Results panel if none match
    if (noResults) {
      if (visibleCount === 0 && members.length > 0) {
        noResults.innerHTML = `
          <i data-lucide="search-code" class="no-results-icon"></i>
          <h3>No matching members found</h3>
          <p>Try adjusting your search query or filters.</p>
        `;
        noResults.style.display = 'flex';
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      } else if (members.length > 0) {
        noResults.style.display = 'none';
      }
    }
  };

  // Attach Event Listeners
  if (searchInput && filterCity && filterDomain && filterTier) {
    searchInput.addEventListener('input', applyFilters);
    filterCity.addEventListener('change', applyFilters);
    filterDomain.addEventListener('change', applyFilters);
    filterTier.addEventListener('change', applyFilters);
  }
});
