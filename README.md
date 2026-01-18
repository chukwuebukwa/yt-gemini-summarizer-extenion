# YouTube Gemini Summarizer

A browser extension that adds a ✦ button to YouTube thumbnails. Click it to instantly summarize any video with Google Gemini.

![Demo](https://img.shields.io/badge/Chrome-Supported-green) ![Demo](https://img.shields.io/badge/Firefox-Supported-orange)

## Features

- **One-click summaries** - ✦ button on every YouTube thumbnail
- **Clickbait buster** - Answers clickbait questions before summarizing
- **Auto-submit** - Opens Gemini, fills the prompt, and submits automatically
- **Configurable** - Toggle options and add custom instructions
- **Works everywhere** - Homepage, search, channels, playlists

## Installation

### Chrome

1. **Download** this repo ([Download ZIP](../../archive/refs/heads/main.zip)) and unzip it
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the unzipped folder
6. Done! You'll see the ✦ icon in your toolbar

### Firefox

1. **Download** this repo ([Download ZIP](../../archive/refs/heads/main.zip)) and unzip it
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select the `manifest.json` file from the unzipped folder
5. Done!

> **Note:** Firefox temporary add-ons are removed when you close the browser. For permanent installation, the extension needs to be signed by Mozilla.

## Usage

1. Go to YouTube
2. Hover over any video thumbnail - you'll see a ✦ button
3. Click it - Gemini opens and summarizes the video
4. Click the extension icon in your toolbar to configure settings

## Settings

Click the extension icon to access settings:

- **Clickbait check** - Answer clickbait title questions first (on by default)
- **Bullet points** - Format summary as bullet points
- **Keep it short** - Limit to 3-5 sentences
- **Custom instructions** - Add your own prompt text

## Requirements

- Google account (logged into Gemini)
- Chrome or Firefox browser

## How It Works

1. Extension adds ✦ button to YouTube thumbnails
2. On click, opens Gemini with the video URL and your configured prompt
3. A content script on Gemini auto-fills the input and clicks submit
4. Gemini processes the video and returns the summary

## Privacy

- No data collection
- Settings stored locally in your browser
- Only communicates with YouTube (to get video info) and Gemini (to summarize)

## License

MIT
