# Trimble Technician Assistant

Static field-tools hub for Trimble technicians — Groundworks PD25, Siteworks CTL measure-up, pre-inspection, excavator tuning, commissioning manuals, and related workflows.

**Live site (GitHub Pages):** `https://justinbill-ai.github.io/trimble-technician-assistant/`

---

## Repository map

| Path | Purpose |
|------|---------|
| `index.html` | Hub — category home and tool drill-in |
| `assets/` | Shared chrome, workspace API, feedback, TMC gate |
| `groundworks/pd25/` | PD25 guided workflow + measure-up calculator |
| `groundworks/wiring/` | Groundworks connection diagram and wiring schematic PDFs |
| `measure-up/ctl/` | Siteworks CTL measure-up calculator |
| `pre-inspection/` | Machine wear / pre-install report |
| `install-deliverable/` | Post-install photo deliverable |
| `excavator/` | Earthworks excavator tuning assistant |
| `bench-crane/` | TMC bench crane assembly guide (gated) |
| `commissioning-manuals/` | Earthworks v2.24 PDF library |
| `google-workspace/` | Apps Script backend (`Code.gs`) + deploy guide |

---

## Local development

Open `index.html` in a browser, or serve the repo root:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/index.html`.

Hard-refresh (**Ctrl+Shift+R**) after pulling changes so cache-busted scripts reload.

---

## Tests

```bash
npm test
```

Runs smoke tests in `tests/run-smoke.js` against PD25 and CTL calculator logic (requires Node.js).

CI runs the same smoke tests on every push and pull request to `main` (see `.github/workflows/smoke-test.yml`).

---

## Google Workspace backend

Telemetry, feedback, and optional Drive report archive are configured in `assets/workspace-config.js`. Setup steps are in [google-workspace/DEPLOY.md](google-workspace/DEPLOY.md).

---

## Adding a new tool

1. Create a folder with `index.html` using shared styles from `assets/trimble-connect.css`.
2. Include workspace scripts: `workspace-config.js`, `workspace-api.js` (and `report-upload.js` if PDF opt-in upload applies).
3. Add `detectTool()` entry in `assets/workspace-api.js`.
4. Wire hub category in `assets/hub-nav.js`.
5. Log at least `tool_open` (automatic on load) and one domain event via `WorkspaceApi.logEvent()`.
6. Add feedback: `feedback.css`, `feedback-config.js`, `feedback.js` (footer link auto-injects).
7. Bump `?v=` cache on changed scripts across HTML entry points.

---

## Telemetry events (summary)

| Event | When |
|-------|------|
| `hub_open` | Hub home loaded |
| `category_open` | Hub category opened |
| `tool_open` | Tool page loaded (`ctl-calculator`, `pd25-calculator`, etc.) |
| `calc_run` | User clicked Calculate / Run calculations (check `tool` column) |
| `csv_uploaded` | Survey CSV file selected |
| `csv_analyzed:ok` | Calculator processed CSV successfully |
| `csv_analyzed:fail` | Calculator error (detail has message) |
| `csv_analyzed:missing` | Required survey point missing from CSV |
| `calc_warnings` | PD25 warnings after calculation |
| `calc_options` | PD25 option snapshot (units, rod settings, etc.) |
| `pdf_exported` | PDF generated |
| `pdf_export_with_dealer` | PDF export with dealer name on optional Drive upload |
| `guide_phase_complete` | PD25 workflow phase finished |
| `guide_section_view` / `guide_section_complete` | Bench crane segment |
| `prestart_complete` | Excavator checklist unlocked |
| `symptom_analyzed` | Excavator symptom search |
| `manual_open` | Commissioning PDF opened |
| `wiring_pdf_open` | Groundworks wiring PDF opened |

Full backend notes: `google-workspace/DEPLOY.md`.
