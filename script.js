// Quest categories and their data folder paths
const QUEST_CATEGORIES = {
  'free-bounty': 'data/free-bounty/',
  'event-bounty': 'data/event-bounty/',
  'bronze-prog': 'data/bronze-prog/',
  'silver-prog': 'data/silver-prog/',
  'gold-prog': 'data/gold-prog/'
};

// List of quest files for each category
const QUEST_FILES = {
  'free-bounty': [
    '01.json',
    '18.json'
  ],
  'event-bounty': [
    '01.json'
  ],
  'bronze-prog': [
    // Add bronze prog quest filenames here
  ],
  'silver-prog': [
    // Add silver prog quest filenames here
  ],
  'gold-prog': [
    // Add gold prog quest filenames here
  ]
};

let currentCategory = 'free-bounty';

// Load quests when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadQuests(currentCategory);
});

// Switch tab function
function switchTab(category) {
  currentCategory = category;
  
  // Update active tab styling
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  event.target.classList.add('active');
  
  // Load quests for the selected category
  loadQuests(category);
}

// Load quests for a category
async function loadQuests(category) {
  const container = document.getElementById('quest-container');
  const loading = document.getElementById('loading');
  const noQuests = document.getElementById('no-quests');
  
  // Show loading
  loading.style.display = 'block';
  container.style.display = 'none';
  noQuests.style.display = 'none';
  container.innerHTML = '';
  
  const questFiles = QUEST_FILES[category] || [];
  const basePath = QUEST_CATEGORIES[category];
  
  if (questFiles.length === 0) {
    loading.style.display = 'none';
    noQuests.style.display = 'block';
    return;
  }
  
  try {
    // Load all quest files for this category
    const questPromises = questFiles.map(filename => 
      fetch(basePath + filename)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load ${filename}`);
          }
          return response.json();
        })
        .catch(error => {
          console.warn(`Could not load ${filename}:`, error);
          return null; // Return null for failed loads
        })
    );
    
    const quests = await Promise.all(questPromises);
    
    // Filter out any null values (failed loads)
    const validQuests = quests.filter(quest => quest !== null);
    
    if (validQuests.length === 0) {
      loading.style.display = 'none';
      noQuests.style.display = 'block';
      noQuests.textContent = 'No quests could be loaded. Please check the console for details.';
      return;
    }
    
    // Sort quests by quest_id
    validQuests.sort((a, b) => {
      if (a.quest_id < b.quest_id) return -1;
      if (a.quest_id > b.quest_id) return 1;
      return 0;
    });
    
    // Render each quest
    validQuests.forEach(quest => {
      const questCard = createQuestCard(quest);
      container.appendChild(questCard);
    });
    
    loading.style.display = 'none';
    container.style.display = 'flex';
    
  } catch (error) {
    console.error('Error loading quests:', error);
    loading.style.display = 'none';
    noQuests.style.display = 'block';
    noQuests.textContent = 'Error loading quests. Please check the console for details.';
  }
}

// Create quest card element
function createQuestCard(quest) {
  const card = document.createElement('div');
  card.className = 'quest-card';
  card.setAttribute('data-quest-id', quest.quest_id);
  
  card.innerHTML = `
    <div class="quest-header" onclick="toggleQuest(this)">
      <img src="${quest.image_url}" alt="${quest.quest_name}" class="quest-image">
      <div class="quest-info">
        <div class="quest-id">${quest.quest_id}</div>
        <h2>${quest.quest_name}</h2>
        <p class="quest-subtitle">${quest.quest_subtitle}</p>
        <div class="quest-difficulty">
          Difficulty: ${renderStars(quest.difficulty.stars, quest.difficulty.half_stars)}
        </div>
      </div>
      <div class="expand-icon">▼</div>
    </div>
    
    <div class="quest-body">
      <div class="quest-body-content">
        <!-- Rewards Section -->
        <div class="rewards">
          <h3>Rewards</h3>
          ${renderRewards(quest.rewards)}
        </div>
        
        <!-- Bounty Coin & Gacha Tickets -->
        <div class="currency-rewards">
          ${renderCurrency('Bounty Coin', quest.bounty_coin)}
          ${renderCurrency('Gacha Ticket', quest.gacha_ticket)}
        </div>
        
        <!-- Requirements -->
        <div class="requirements">
          <h3>Requirements</h3>
          <p><strong>Mode:</strong> ${quest.requirements.mode}</p>
          ${renderModeNotes(quest.requirements.mode_notes)}
          ${renderRestrictions(quest.requirements.restrictions, 'Restrictions')}
          ${renderRestrictions(quest.requirements.multiplayer_restrictions, 'Multiplayer Restrictions')}
          ${renderWeaponTimeRequirements(quest.requirements.weapon_time_requirements)}
        </div>
        
        <!-- How to Claim -->
        <div class="how-to-claim">
          <h3>How to Claim</h3>
          ${renderClaimRequirements(quest.how_to_claim)}
        </div>
      </div>
    </div>
  `;
  
  return card;
}

// Toggle quest expansion
function toggleQuest(headerElement) {
  const card = headerElement.closest('.quest-card');
  card.classList.toggle('expanded');
}

// Render stars
function renderStars(stars, halfStars) {
  const fullStars = '⭐'.repeat(stars);
  const half = halfStars > 0 ? '🌟' : '';
  return fullStars + half;
}

// Render rewards
function renderRewards(rewards) {
  let html = '';
  
  ['solo', 'multiplayer', 'speedrun'].forEach(type => {
    if (rewards[type] && rewards[type].length > 0) {
      html += `
        <div class="reward-section">
          <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
          <ul>
            ${rewards[type].map(reward => 
              `<li>${reward.item} x${reward.quantity}</li>`
            ).join('')}
          </ul>
        </div>
      `;
    }
  });
  
  return html;
}

// Render currency (Bounty Coin or Gacha Ticket)
function renderCurrency(title, currency) {
  const hasValues = currency.solo || currency.multiplayer || currency.speedrun;
  
  if (!hasValues) return '';
  
  let html = `
    <div class="currency-section">
      <h4>${title}</h4>
  `;
  
  if (currency.solo) {
    html += `<p>Solo: ${currency.solo}</p>`;
  }
  if (currency.multiplayer) {
    html += `<p>Multiplayer: ${currency.multiplayer}</p>`;
  }
  if (currency.speedrun) {
    html += `<p>Speedrun: ${currency.speedrun}</p>`;
  }
  
  html += `</div>`;
  return html;
}

// Render mode notes
function renderModeNotes(notes) {
  if (!notes || notes.length === 0) return '';
  
  return `
    <div class="mode-notes">
      ${notes.map(note => `<p>• ${note}</p>`).join('')}
    </div>
  `;
}

// Render restrictions
function renderRestrictions(restrictions, title) {
  if (!restrictions || restrictions.length === 0) return '';
  
  return `
    <div>
      <strong>${title}:</strong>
      <ul>
        ${restrictions.map(restriction => `<li>${restriction}</li>`).join('')}
      </ul>
    </div>
  `;
}

// Render weapon time requirements
function renderWeaponTimeRequirements(requirements) {
  if (!requirements || requirements.length === 0) return '';
  
  let html = '<div><strong>Time Requirements:</strong>';
  
  requirements.forEach(req => {
    html += `
      <div class="weapon-time">
        <p><strong>[${req.weapons.join(', ')}]</strong></p>
        <p>Under ${req.time_limit_minutes} minutes</p>
        ${req.submission_note ? `<p class="note">${req.submission_note}</p>` : ''}
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

// Render claim requirements
function renderClaimRequirements(claimInfo) {
  let html = '';
  
  // Screenshot requirements
  if (claimInfo.screenshot_requirements && claimInfo.screenshot_requirements.length > 0) {
    html += `
      <div class="claim-section">
        <strong>Screenshot Requirements:</strong>
        <ul>
          ${claimInfo.screenshot_requirements.map(req => `<li>${req}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  // Multiplayer requirements
  if (claimInfo.multiplayer_requirements && claimInfo.multiplayer_requirements.length > 0) {
    html += `
      <div class="claim-section">
        <strong>Multiplayer Requirements:</strong>
        <ul>
          ${claimInfo.multiplayer_requirements.map(req => `<li>${req}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  // Speedrun submission note
  if (claimInfo.speedrun_submission_note) {
    html += `
      <div class="claim-section">
        <strong>Note:</strong> ${claimInfo.speedrun_submission_note}
      </div>
    `;
  }
  
  // Proof required
  if (claimInfo.proof_required && claimInfo.proof_required.length > 0) {
    html += `
      <div class="claim-section">
        <strong>Proof Required:</strong>
        <ul>
          ${claimInfo.proof_required.map(proof => `<li>${proof}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  return html;
}