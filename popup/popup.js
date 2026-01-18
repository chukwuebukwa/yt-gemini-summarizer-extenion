// Default settings
const DEFAULT_SETTINGS = {
  clickbaitCheck: true,
  bulletPoints: false,
  keepShort: false,
  customPrompt: ''
};

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.sync.get('settings');
  const settings = { ...DEFAULT_SETTINGS, ...result.settings };

  document.getElementById('clickbait-check').checked = settings.clickbaitCheck;
  document.getElementById('bullet-points').checked = settings.bulletPoints;
  document.getElementById('keep-short').checked = settings.keepShort;
  document.getElementById('custom-prompt').value = settings.customPrompt;
}

// Save settings to storage
async function saveSettings() {
  const settings = {
    clickbaitCheck: document.getElementById('clickbait-check').checked,
    bulletPoints: document.getElementById('bullet-points').checked,
    keepShort: document.getElementById('keep-short').checked,
    customPrompt: document.getElementById('custom-prompt').value.trim()
  };

  await chrome.storage.sync.set({ settings });

  // Show save confirmation
  const status = document.getElementById('save-status');
  status.textContent = 'Settings saved!';
  setTimeout(() => {
    status.textContent = '';
  }, 2000);
}

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);
document.getElementById('save-btn').addEventListener('click', saveSettings);
