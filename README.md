# Quick Link

`Quick Link` is a Chrome extension that manages grouped shortcut links from the right-side panel.

The current implementation includes:

- React-based side panel UI
- Group create, rename, collapse/expand, delete, and reorder
- Link create, edit, delete, search, and reorder within each group
- Persistence and synchronization with `chrome.storage.local`
- Open a link in the current tab when clicked
- Toggle the side panel when the extension action icon is clicked

## Structure

- `src/sidepanel`: Quick Link panel UI and interactions
- `src/lib`: Link and storage utilities
- `src/background/index.js`: Toggles the side panel when the action icon is clicked
- `public/manifest.json`: Extension metadata
