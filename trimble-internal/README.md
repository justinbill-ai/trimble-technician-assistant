# Trimble Internal package

Personnel-only tools separated from the **dealer-facing** Technician Assistant on GitHub Pages.

**Do not deploy this folder to the public GitHub Pages site.**

---

## Contents

| Path | Tool |
|------|------|
| `index.html` | Internal hub (TMC + Groundworks utilities) |
| `bench-crane/` | TMC Bench Crane Assembly Guide |
| `groundworks/csv-formatter/` | Groundworks pile CSV formatter |
| `docs/` | Internal architecture and icon preview pages |

Shared styles, access gate, and Apps Script client live in the parent `assets/` folder.

---

## Local preview

From the **repository root**:

```powershell
cd "C:\Users\jbill\Documents\Trimble Technician Assistant"
python -m http.server 8080
```

- **Internal hub:** http://localhost:8080/trimble-internal/index.html  
- **Bench crane:** http://localhost:8080/trimble-internal/bench-crane/index.html  
- **CSV formatter:** http://localhost:8080/trimble-internal/groundworks/csv-formatter/index.html  

On localhost, `workspace-config.js` in this folder enables internal preview mode. For a real internal host, set `trimbleInternalLocalPreview: false` and require verified `@trimble.com` sign-in.

---

## Access model

1. User signs in through the same Apps Script access gate as the dealer app.
2. `@trimble.com` users receive a sign-in code by email (auto-approved).
3. Internal tools are path-guarded by `assets/trimble-internal.js`.
4. Dealers who only use the dealer hub never see links to this package.

---

## Deployment (when approved)

Use one of:

- **Private GitHub repo** + access-controlled hosting  
- **Trimble internal web host** (VPN / SSO)  
- **Separate branch** that is never published to `github.io`

Never copy `trimble-internal/` into the public Pages deploy artifact.

---

## Tests

CSV formatter smoke tests run from the repo root:

```bash
npm test
```

The formatter module path is `trimble-internal/groundworks/csv-formatter/formatter.js`.
