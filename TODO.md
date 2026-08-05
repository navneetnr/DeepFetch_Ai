# Global Light/Dark Theme Refactor

## Goal
Make the theme toggle apply across the ENTIRE app (not just search bar) by adding light/dark variants to all components.

## Plan
1. **ThemeContext** — verify it toggles `dark` class on `<html>`, persists to localStorage, and initializes from storage. (DONE)
2. **App.jsx** — root wrappers use `light: bg-slate-50 text-slate-900` / `dark: bg-slate-950 text-slate-100`.
3. **Sidebar.jsx** — `light: bg-white border-r border-slate-200 text-slate-800` / `dark: bg-slate-900 border-r border-slate-800 text-slate-200`.
4. **Navbar.jsx** — already mostly themed; fix indentation & ensure Sun/Moon toggle present.
5. **ReportViewer.jsx** — markdown card, header, action bar, code/tables contrast.
6. **AgentTraceViewer.jsx** — trace panel, workflow grid, log terminal.
7. **SourceCitationDashboard.jsx** — source cards.
8. **SettingsModal.jsx** / **LogoutConfirmationModal.jsx** / **AuthModal.jsx** — modals light/dark.
9. **ResearchForm.jsx** — search bar & presets.
10. **index.css** — add markdown code blocks, tables, borders for both modes.
11. Build & commit.

## Status Tracking
- [x] ThemeContext global state
- [ ] App.jsx root wrappers
- [ ] Sidebar
- [ ] Navbar cleanup
- [ ] ReportViewer
- [ ] AgentTraceViewer
- [ ] SourceCitationDashboard
- [ ] Modals (Settings, Logout, Auth)
- [ ] ResearchForm
- [ ] index.css markdown/code/tables
- [ ] Build & commit
