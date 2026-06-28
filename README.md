# missionlog
A minimalist habit tracker with multi-habit support, persistent storage, and monthly progress summaries — built for Stardance.

## Mission Log
This app is a lightweight habit tracker designed to run in the browser using plain HTML, CSS, and JavaScript.

### Features
- Add and remove multiple habits
- Monthly calendar grid with Sun–Sat layout
- Per-habit completion dots in each day cell
- Tap each dot to toggle completion for that habit and day
- Current day highlighted, future days disabled
- Monthly progress summary with completion percentage and progress bars
- Data saved locally in browser storage

### How to use
1. Open `missionlog.html` in your browser.
2. Add habit names in the top form.
3. Use the month navigation arrows to move between months.
4. Tap a dot for a habit on a day to mark it complete or incomplete.
5. Review progress in the summary section.

### Persistence
This app uses browser `localStorage` to keep habits and completion data saved across sessions. No backend is required.
