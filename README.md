# QuickNotes

QuickNotes is a small, responsive note-taking app for capturing and organizing personal, work, and study notes. Notes are stored in your browser with `localStorage`, so they remain available when you reopen the app in the same browser.

## Features

- Add notes with a Personal, Work, or Study category.
- Search notes by text, without case sensitivity.
- Delete one note or clear all notes after confirmation.
- Validate empty notes and notes longer than 200 characters.
- Keep notes between visits using browser storage.

## Getting started

Open `index.html` in a modern web browser. No build step or package installation is required.

## Project files

| File | Description |
| --- | --- |
| `index.html` | App structure, note form, search, and notes list. |
| `style.css` | Responsive layout, category colors, and note card styles. |
| `script.js` | Note creation, validation, deletion, search, and local storage. |
| `README.md` | Project overview and usage instructions. |

Notes are saved only in the current browser's local storage; they are not synced across browsers or devices.
