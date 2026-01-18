(function() {
  'use strict';

  // Track processed thumbnails to avoid duplicates
  const processedThumbnails = new WeakSet();

  // Popup state
  let popup = null;
  let currentVideoId = null;

  // Iframe support detection
  let iframeSupported = null; // null = unknown, true = works, false = blocked
  let iframeTestComplete = false;

  // Gemini base URL
  const GEMINI_BASE_URL = 'https://gemini.google.com/app';

  // Extract video ID from YouTube URL
  function getVideoIdFromUrl(url) {
    if (!url) return null;

    // Handle /watch?v= format
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];

    // Handle /shorts/ format
    const shortsMatch = url.match(/\/shorts\/([^?&]+)/);
    if (shortsMatch) return shortsMatch[1];

    return null;
  }

  // Find the thumbnail container element within a video item
  function findThumbnailContainer(item) {
    // New YouTube layout: the link wrapping the thumbnail
    const thumbnailLink = item.querySelector('a.yt-lockup-view-model__content-image');
    if (thumbnailLink) return thumbnailLink;

    // Alternative: yt-thumbnail-view-model
    const newThumbnail = item.querySelector('yt-thumbnail-view-model');
    if (newThumbnail) return newThumbnail;

    // Legacy layout: ytd-thumbnail
    const legacyThumbnail = item.querySelector('ytd-thumbnail');
    if (legacyThumbnail) return legacyThumbnail;

    // Fallback: a#thumbnail
    const thumbnailAnchor = item.querySelector('a#thumbnail');
    if (thumbnailAnchor) return thumbnailAnchor;

    return null;
  }

  // Find the video link within an item
  function findVideoLink(item) {
    // New layout: a.yt-lockup-view-model__content-image
    const newLink = item.querySelector('a.yt-lockup-view-model__content-image');
    if (newLink) return newLink;

    // Legacy layout: a#thumbnail
    const legacyLink = item.querySelector('a#thumbnail');
    if (legacyLink) return legacyLink;

    // Fallback: any link with /watch?v=
    const anyWatchLink = item.querySelector('a[href*="/watch?v="]');
    if (anyWatchLink) return anyWatchLink;

    return null;
  }

  // Build prompt for video
  function buildPrompt(videoId) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return `Please summarize this YouTube video: ${videoUrl}`;
  }

  // Open Gemini in new tab with prompt in URL hash
  function openInNewTab(videoId) {
    const prompt = buildPrompt(videoId);
    const geminiUrl = `${GEMINI_BASE_URL}#yt-summarize=${encodeURIComponent(prompt)}`;
    window.open(geminiUrl, '_blank', 'noopener,noreferrer');
  }

  // Show a toast notification
  function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.yt-gemini-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'yt-gemini-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => toast.remove(), 3000);
  }

  // Preload test: Check if Gemini allows iframe embedding
  function testIframeSupport() {
    return new Promise((resolve) => {
      const testIframe = document.createElement('iframe');
      testIframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
      testIframe.src = GEMINI_BASE_URL;

      let resolved = false;

      const cleanup = () => {
        if (testIframe.parentNode) {
          testIframe.parentNode.removeChild(testIframe);
        }
      };

      const done = (supported) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(supported);
      };

      // If iframe errors out, it's blocked
      testIframe.addEventListener('error', () => done(false));

      // Check after load
      testIframe.addEventListener('load', () => {
        // Give it a moment, then check if we can detect content
        setTimeout(() => {
          try {
            // Try to access iframe - if cross-origin, this throws
            const doc = testIframe.contentDocument || testIframe.contentWindow?.document;
            // If we get here and doc exists with content, might be working
            // But most likely Gemini will block with X-Frame-Options
            if (doc && doc.body && doc.body.innerHTML.length > 0) {
              done(true);
            } else {
              // Empty or no access - likely blocked
              done(false);
            }
          } catch (e) {
            // Cross-origin error - iframe loaded something but we can't access it
            // This could mean it's working OR it loaded an error page
            // We'll assume it might work and verify later
            done(true);
          }
        }, 1500);
      });

      document.body.appendChild(testIframe);

      // Timeout fallback - if nothing happens in 5s, assume blocked
      setTimeout(() => done(false), 5000);
    });
  }

  // Create the summarize button with container
  function createSummarizeButton(videoId) {
    const container = document.createElement('div');
    container.className = 'yt-gemini-btn-container';

    const button = document.createElement('button');
    button.className = 'yt-gemini-summarize-btn';
    button.textContent = 'Summarize';
    button.setAttribute('data-video-id', videoId);

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleSummarizeClick(videoId);
    });

    container.appendChild(button);
    return container;
  }

  // Handle summarize button click
  function handleSummarizeClick(videoId) {
    // Gemini blocks iframes with X-Frame-Options: deny
    // Always open in new tab
    openInNewTab(videoId);
  }

  // Create the popup container
  function createPopup() {
    const container = document.createElement('div');
    container.className = 'yt-gemini-popup';
    container.innerHTML = `
      <div class="yt-gemini-popup-header">
        <span class="yt-gemini-popup-title">Gemini Summary</span>
        <button class="yt-gemini-popup-close">&times;</button>
      </div>
      <div class="yt-gemini-popup-content">
        <div class="yt-gemini-popup-loading">
          <div class="yt-gemini-spinner"></div>
          <span>Loading Gemini...</span>
        </div>
        <iframe class="yt-gemini-popup-iframe" src="about:blank" allow="clipboard-write"></iframe>
      </div>
    `;

    // Close button handler
    container.querySelector('.yt-gemini-popup-close').addEventListener('click', () => {
      closePopup();
    });

    const iframe = container.querySelector('.yt-gemini-popup-iframe');

    // Handle iframe load errors
    iframe.addEventListener('error', () => {
      handleIframeFailed();
    });

    return container;
  }

  // Handle iframe load failure - auto open new tab
  function handleIframeFailed() {
    iframeSupported = false;
    closePopup();
    if (currentVideoId) {
      openInNewTab(currentVideoId);
    }
  }

  // Open the popup with Gemini
  function openPopup(videoId) {
    if (!popup) {
      popup = createPopup();
      document.body.appendChild(popup);
    }

    currentVideoId = videoId;
    const geminiUrl = buildGeminiUrl(videoId);

    const iframe = popup.querySelector('.yt-gemini-popup-iframe');
    const loading = popup.querySelector('.yt-gemini-popup-loading');

    // Show loading state
    loading.style.display = 'flex';
    iframe.style.opacity = '0';

    // Load Gemini
    iframe.src = geminiUrl;

    // Show popup with animation
    popup.classList.remove('yt-gemini-popup-hidden');
    popup.classList.add('yt-gemini-popup-visible');

    // Set up load detection
    let loadHandled = false;

    const onLoad = () => {
      if (loadHandled) return;

      // Wait a moment then check if iframe has content
      setTimeout(() => {
        if (loadHandled) return;
        loadHandled = true;

        try {
          // Try to detect if iframe loaded properly
          // Cross-origin will throw, which is fine (means it loaded something)
          const doc = iframe.contentDocument || iframe.contentWindow?.document;

          if (doc) {
            // We can access it - check if it has content
            if (doc.body && doc.body.innerHTML.length > 100) {
              // Has content, show it
              loading.style.display = 'none';
              iframe.style.opacity = '1';
              iframeSupported = true;
            } else {
              // Empty or error page - iframe blocked
              handleIframeFailed();
            }
          }
        } catch (e) {
          // Cross-origin error - iframe loaded something
          // Assume it's working
          loading.style.display = 'none';
          iframe.style.opacity = '1';
          iframeSupported = true;
        }
      }, 2000);
    };

    iframe.addEventListener('load', onLoad, { once: true });

    // Timeout - if nothing loads in 8 seconds, bail to new tab
    setTimeout(() => {
      if (!loadHandled) {
        loadHandled = true;
        handleIframeFailed();
      }
    }, 8000);
  }

  // Close the popup
  function closePopup() {
    if (popup) {
      popup.classList.remove('yt-gemini-popup-visible');
      popup.classList.add('yt-gemini-popup-hidden');

      // Clear iframe after animation
      setTimeout(() => {
        const iframe = popup.querySelector('.yt-gemini-popup-iframe');
        if (iframe) iframe.src = 'about:blank';
      }, 300);
    }
  }

  // Process a single video item
  function processVideoItem(item) {
    if (processedThumbnails.has(item)) return;

    // Check if button already exists
    if (item.querySelector('.yt-gemini-btn-container')) return;

    // Find the video link
    const link = findVideoLink(item);
    if (!link) return;

    const href = link.getAttribute('href');
    const videoId = getVideoIdFromUrl(href);
    if (!videoId) return;

    // Find the thumbnail container to attach button
    const thumbnailContainer = findThumbnailContainer(item);
    if (!thumbnailContainer) return;

    // Mark as processed
    processedThumbnails.add(item);

    // Create and add the button container
    const buttonContainer = createSummarizeButton(videoId);

    // Ensure thumbnail wrapper is positioned for absolute children
    const computedPosition = window.getComputedStyle(thumbnailContainer).position;
    if (computedPosition === 'static') {
      thumbnailContainer.style.position = 'relative';
    }

    thumbnailContainer.appendChild(buttonContainer);
    console.log('[YT Gemini] Added button for video:', videoId);
  }

  // Scan page for video items
  function scanForThumbnails() {
    // New YouTube layout selectors
    const videoItems = document.querySelectorAll(
      'ytd-rich-item-renderer, ' +           // Home page grid items
      'ytd-video-renderer, ' +               // Search results
      'ytd-compact-video-renderer, ' +       // Sidebar recommendations
      'ytd-grid-video-renderer, ' +          // Channel page grid
      'ytd-playlist-video-renderer, ' +      // Playlist items
      'ytd-thumbnail, ' +                    // Legacy thumbnail
      'ytd-playlist-thumbnail'               // Legacy playlist thumbnail
    );
    videoItems.forEach(processVideoItem);
  }

  // Set up MutationObserver for dynamic content
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }

      if (shouldScan) {
        // Debounce scanning
        clearTimeout(setupObserver.timeout);
        setupObserver.timeout = setTimeout(scanForThumbnails, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    if (popup && popup.classList.contains('yt-gemini-popup-visible')) {
      if (!popup.contains(e.target) && !e.target.classList.contains('yt-gemini-summarize-btn')) {
        closePopup();
      }
    }
  });

  // Close popup on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePopup();
    }
  });

  // Initialize
  function init() {
    console.log('[YT Gemini] Initialized - click Summarize to open Gemini in new tab');
    scanForThumbnails();
    setupObserver();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
