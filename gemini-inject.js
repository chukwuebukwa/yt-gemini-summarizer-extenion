// Gemini auto-fill script
(function() {
  'use strict';

  // Check for prompt in URL hash
  const hash = window.location.hash;
  if (!hash || !hash.startsWith('#yt-summarize=')) {
    return;
  }

  // Extract and decode the prompt
  const prompt = decodeURIComponent(hash.substring('#yt-summarize='.length));
  if (!prompt) return;

  console.log('[YT Gemini] Auto-filling prompt:', prompt);

  // Clear the hash so it doesn't persist on refresh
  history.replaceState(null, '', window.location.pathname + window.location.search);

  // Wait for Gemini to load and find the input
  function fillInput() {
    // Gemini uses a contenteditable div or textarea - try multiple selectors
    const selectors = [
      'div[contenteditable="true"]',
      'textarea',
      '.ql-editor',
      '[data-placeholder]',
      'rich-textarea div[contenteditable]',
      '.input-area [contenteditable]'
    ];

    let input = null;
    for (const selector of selectors) {
      input = document.querySelector(selector);
      if (input) {
        console.log('[YT Gemini] Found input with selector:', selector);
        break;
      }
    }

    if (!input) {
      console.log('[YT Gemini] Input not found, retrying...');
      return false;
    }

    // Fill the input
    if (input.tagName === 'TEXTAREA') {
      input.value = prompt;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Contenteditable div
      input.focus();
      input.textContent = prompt;
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Also try setting innerHTML with a paragraph
      if (!input.textContent) {
        input.innerHTML = `<p>${prompt}</p>`;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    console.log('[YT Gemini] Prompt filled!');

    // Click the submit button after a short delay
    setTimeout(() => {
      const submitSelectors = [
        'button.send-button',
        'button[aria-label="Send message"]',
        'button.submit',
        'button[mat-icon-button].send-button',
        'mat-icon[fonticon="send"]'
      ];

      let submitBtn = null;
      for (const selector of submitSelectors) {
        submitBtn = document.querySelector(selector);
        if (submitBtn) {
          // If we found the icon, get the parent button
          if (submitBtn.tagName === 'MAT-ICON') {
            submitBtn = submitBtn.closest('button');
          }
          if (submitBtn) {
            console.log('[YT Gemini] Found submit button with selector:', selector);
            break;
          }
        }
      }

      if (submitBtn) {
        submitBtn.click();
        console.log('[YT Gemini] Submitted!');
      } else {
        console.log('[YT Gemini] Submit button not found');
      }
    }, 500);

    return true;
  }

  // Try immediately, then retry with delays
  if (!fillInput()) {
    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(() => {
      attempts++;
      if (fillInput() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.log('[YT Gemini] Could not find input after', maxAttempts, 'attempts');
        }
      }
    }, 500);
  }
})();
