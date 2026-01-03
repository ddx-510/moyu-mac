# Deployment Guide

This guide explains how to:
1.  **Build your application** (generate the `.dmg` installer).
2.  **Host your installer** (using GitHub Releases).
3.  **Deploy your landing page** (using GitHub Pages) and link it to the installer.

---

## Part 1: Build the Application

To create the downloadable `.dmg` file for macOS users:

1.  Open your terminal in the project root.
2.  Run the build command:
    ```bash
    npm run build:mac
    ```
3.  Once finished, you will find the installer in the `dist` folder:
    *   `dist/Moyu-1.0.0.dmg` (or similar, depending on version/arch)

---

## Part 2: Release & Host the App

The best way to host your app installer is using **GitHub Releases**.

1.  Push your latest code to GitHub.
2.  Go to your repository: [https://github.com/ddx-510/moyu-mac](https://github.com/ddx-510/moyu-mac)
3.  Click **Releases** (sidebar) -> **Draft a new release**.
4.  **Tag version**: `v1.0.0` (Must match `package.json`).
5.  **Release title**: "Moyu v1.0.0 - Initial Release".
6.  **Attach binaries**: Drag and drop the `.dmg` file from your `dist` folder into the upload area.
7.  Click **Publish release**.

**Copy the Download Link**:
After publishing, right-click the `.dmg` file in the release assets and "Copy Link Address". It will look like:
`https://github.com/ddx-510/moyu-mac/releases/download/v1.0.0/Moyu-1.0.0.dmg`

---

## Part 3: Deploy the Landing Page

We will use **GitHub Pages** to host the website in the `web/` folder.

### Step 3a: Update the Download Button
1.  Open `web/index.html`.
2.  Find the "Download for macOS" button.
3.  Update the `onclick` or `href` to point to the link you copied in Part 2.
    *   *I have automatically updated this to point to a standard GitHub Release URL pattern for you.*

### Step 3b: Publish to GitHub Pages
1.  Go to your repository **Settings** -> **Pages**.
2.  **Source**: Deploy from a branch.
3.  **Branch**: Select `main` -> Select folder `/ (root)` (Note: GitHub Pages usually serves root or docs. Since your site is in `web/`, we have a small trick or we can deploy specifically the `web` folder).

**Better Method for `web/` folder**:
Since the site is in a subfolder (`web/`), the easiest way is checking in a configured `gh-pages` branch or using a setting if available.

**Alternative (Easiest for this structure)**:
1.  Go to **Settings** -> **Pages**.
2.  If you can't select `web/ folder`, use this manual trick:
    *   Move `web/index.html` and `web/assets...` to `docs/` folder.
    *   Push to GitHub.
    *   Select `/docs` folder in GitHub Pages settings.

**Or just deploy the whole repo root**:
If you select `/ (root)`, your site will be available at:
`https://ddx-510.github.io/moyu-mac/web/index.html`

To make it cleaner (`https://ddx-510.github.io/moyu-mac/`), you would typically move the `web` contents to the root or `docs` folder.

---

## Summary Checklist
- [ ] Run `npm run build:mac`
- [ ] Create GitHub Release `v1.0.0` and upload `.dmg`
- [ ] Update `web/index.html` link if filename differs
- [ ] Enable GitHub Pages (recommend moving `web/*` to `docs/` for cleaner URL)
