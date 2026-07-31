# TMC Bench Crane Assembly Guide

Interactive assembly guide for the TMC bench crane, part of **Trimble Technician Assistant**.

## Open the guide

Double-click **`index.html`** in this folder to open it in your browser. No web server or build step is required.

## Access control (TMC category)

TMC tools prompt for email before opening. Rules live in `../assets/tmc-access.js` and are not shown in the UI.

- Hub: clicking a TMC tool opens a short email prompt if not already verified on this device.
- Bookmarks to this guide show the same prompt when needed.
- Access can be remembered for up to 30 days (optional checkbox).

Shared module: `../assets/tmc-access.js` (client-side check — pair with hosting restrictions for production).

## Step and tool images (Google Drive)

Assembly photos are loaded from Google Drive. Images live in shared Drive folders; each file ID is registered in **`CRANE_DRIVE_IMAGES`** in `guide-data.js`.

### Drive folders

| Folder key | Used for | Link |
|------------|----------|------|
| `requiredTools` | Overview → Required tools | [Required Tools](https://drive.google.com/drive/folders/1h9QVjgo54hqxXqasZmnj-NzyL1BleGUJ?usp=drive_link) |

Add more entries to **`CRANE_DRIVE_FOLDERS`** in `guide-data.js` as you create subfolders for other segments (e.g. Base Plates step photos).

### Adding or updating an image

1. Upload the image to the appropriate Drive subfolder.
2. Share the **file** (and folder) as **Anyone with the link can view**.
3. Copy the file ID from the share URL (the string between `/d/` and `/view`).
4. Paste the ID into **`CRANE_DRIVE_IMAGES`** in `guide-data.js`:

| Key | Used for |
|-----|----------|
| `ruthexTipSet` | Ruthex heat-set tip set (Overview → Required tools) |
| `base01Join` | Base step 1 — join plates + optional dowels |
| `base02BoomMount` | Base step 2 — boom mount prep |
| `base03AxioMount` | Base step 3 — mount Axio Group on base plates |
| `base04Extrusions` | Base step 4 — extrusions |
| `bucketPrintOrientation` | Bucket Attachment — recommended print layout |

Steps and tools reference images via `imageDriveId` keys that map to these entries. Send a file or folder link when you add new photos and the matching key will be filled in.
