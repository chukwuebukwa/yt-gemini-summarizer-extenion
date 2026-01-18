# YouTube Gemini Summarizer

A browser extension that adds "Summarize" buttons to YouTube video thumbnails. Click to instantly open Google Gemini with a pre-filled prompt to summarize the video.

## Features

- **One-click summaries** - Summarize button appears on every YouTube thumbnail
- **Auto-fill & submit** - Opens Gemini, fills the prompt, and submits automatically
- **Works everywhere** - Homepage, search results, channel pages, playlists
- **SPA-aware** - Buttons persist when navigating within YouTube
- **Cross-browser** - Chrome and Firefox support (Manifest V3)

## Installation

### Chrome
1. Download/clone this repository
2. Go to `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `youtube-gemini-summarizer` folder

### Firefox
1. Download/clone this repository
2. Go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file

## How It Works

1. **On YouTube**: The extension injects a "Summarize" button on every video thumbnail
2. **Click Summarize**: Opens Gemini in a new tab with a URL hash containing the prompt
3. **On Gemini**: A content script detects the hash, fills the input field, and clicks submit
4. **Result**: Gemini processes your request and summarizes the video

## Files

```
youtube-gemini-summarizer/
├── manifest.json       # Extension manifest (v3)
├── content.js          # YouTube content script (button injection)
├── content.css         # Styles for buttons
├── gemini-inject.js    # Gemini content script (auto-fill & submit)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Permissions

- `activeTab` - Access to the current tab only
- Content scripts run on:
  - `youtube.com` - To inject summarize buttons
  - `gemini.google.com` - To auto-fill and submit prompts

## Technical Details

### YouTube Integration
- Uses MutationObserver to detect dynamically loaded thumbnails
- Listens for `yt-navigate-finish` events for SPA navigation
- Supports multiple thumbnail container types:
  - `ytd-rich-item-renderer` (homepage grid)
  - `ytd-video-renderer` (search results)
  - `ytd-compact-video-renderer` (sidebar)
  - `ytd-thumbnail` (legacy)

### Gemini Integration
- Passes prompt via URL hash (`#yt-summarize=...`)
- Finds input field using multiple selectors for compatibility
- Auto-clicks the send button after filling

## Limitations

- Gemini blocks iframe embedding (X-Frame-Options: deny), so the extension opens a new tab
- Gemini doesn't support URL query parameters for prompts natively, so we use a content script workaround
- Requires being logged into Gemini

## License

MIT
