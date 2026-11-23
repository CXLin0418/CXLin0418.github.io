# Xilin Chen · Mathematics in motion

[CXLin0418.github.io](https://cxlin0418.github.io/)

A personal academic website about PDEs, integrable systems, AI, and Lean. All four pages, fonts, illustrations, and browser interactions are included.

## Preview

Open `index.html` in a browser. To preview over HTTP, run this command from the folder containing that file, then visit the localhost address printed in the terminal.

```sh
python3 -m http.server --bind 127.0.0.1 8000
```

## Publish on GitHub Pages

1. Sign in to your GitHub account and create a repository named `YOUR-USERNAME.github.io`, substituting your lowercase GitHub username. Use a public repository for GitHub Free.
2. Put the **contents** of this folder, including `index.html`, `assets/`, and the empty `.nojekyll` file, at the root of the repository’s `main` branch.
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**, then save.
4. Once GitHub finishes deploying, open **Visit site** in Pages settings. Future commits to `main` update the site.

The site also works under a project repository’s path because all internal links are relative. See [GitHub’s site creation guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) and [publishing source settings](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Edit

| File | Contents |
| --- | --- |
| `index.html` | Introduction, wave figure, and featured work |
| `research.html` | Paper citation, theorem summary, and wave model |
| `workflow.html` | Lean workflow skills and a worked example |
| `playground.html` | Proof playground layout |
| `assets/circle-mode.js` | Exact focusing standing wave and cubic source density on the unit circle |
| `assets/circle-plot.js` | Linked planar field and circle-source plots, animation, and controls |
| `assets/playground.js` | Tactics, goals, hints, and puzzle feedback |
| `assets/Playground.lean` | Three complete examples checked with Lean 4.34.1 |
| `assets/styles.css` | Typography, colors, responsive layouts, and controls |

The pages are plain HTML. Edit the shared navigation and footer in each page when adding a new section. The bundled Instrument Serif and DM Sans fonts include their SIL Open Font License files in `assets/fonts/`.
