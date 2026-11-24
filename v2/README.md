# Coastal Test Lab (v2)

A static GitHub Pages site for testing and demonstrating CXone integrations (Guide, Chat, event broadcasting, Copilot).
Every scenario is one entry in `scenarios.json`. The hub (`index.html`) lists them, and `scenario.html?scenario=<id>`
loads one in a realistic customer page with a Test Panel showing the integration, tenant, full script tag and event log.

## Files

| File | Purpose |
|---|---|
| `index.html` | Scenario hub (cards, filters, search) |
| `scenario.html` | The single scenario page. Guide rules match on its query string |
| `scenarios.json` | All scenarios, integrations, environments and settings |
| `app.js` / `styles.css` | Shared code and styling |
| `assets/` | Hero photo (1600 and 800 wide) and the illustrated fallback |
| `tools/validate.js` | Checks `scenarios.json` before you commit |

## Adding a scenario

1. Copy an existing entry in `scenarios.json` and change at least `id`, `title`, `integration`, `category`, `tenant`, `description`, `how` and `calls`.
2. Run `node tools/validate.js`.
3. Commit and push. The new card appears on the hub automatically.
4. In CXone, add a Guide/Chat rule that matches the new URL, for example `scenario=<id>`.

### Scenario fields

| Field | Meaning |
|---|---|
| `id` | URL key. Lowercase letters, numbers and dashes. **Must not be contained in any other id** |
| `integration` | `guide`, `chat`, `events` or `ai` (defined under `integrations`; add your own) |
| `tenant` | Number passed to `cxone('init', '<tenant>')`. Can differ per scenario |
| `calls` | Script lines placed after the init call, e.g. `cxone('guide', 'init');` |
| `events` | Optional list of Guide event names. Adds listeners to the script and fills the on-page event log |
| `extra` | Optional extra script lines (custom CSS, commented-out options, etc.) |
| `site` / `siteName` | `portal` or `support` page layout, and the heading shown over the photo |
| `hero`, `hero800` | Optional per-scenario hero images (default is set under `settings`) |
| `loader` | Optional per-scenario loader URL (default comes from the selected environment) |
| `digitalPoc` | Optional text: the Digital point of contact for this scenario. Shown in the Test Panel |
| `skill` | Optional text: the skill associated with this scenario. Shown in the Test Panel |
| `comment` | Optional free text (use `\n` for line breaks). Shown in the Test Panel |
| `legacyPage` | The old `about*.html` page this scenario replaces (information only) |

### Guide rules match any part of the URL

Because a rule that matches `guide-3btn` would also match `guide-3btn-menu`, ids must be distinct and never be a
substring of another id. The hub shows a red warning and `tools/validate.js` fails if this happens.

## The Test Panel

- **Tenant** can be changed for a quick test, and **Additional script lines** appends your own lines.
  **Apply & reload** saves them in your browser only (localStorage) for that scenario. **Reset to JSON** clears them.
  To make a change permanent, edit `scenarios.json`.
- **Full script tag** is exactly what is injected into the page.
- The status line reports whether the CXone loader loaded.

## Environments

`settings.environments` currently has only NA1 Production. To add another (for example QA), add an entry with its
`label` and `loader` URL. A selector appears automatically when there is more than one.

## Running locally

`scenarios.json` is loaded with `fetch`, so serve the folder rather than opening the files directly:

```
python -m http.server 8000
```

Then open http://localhost:8000/. Note that the CXone widget may not behave the same on localhost as on the
published site, and Guide rules may need to include the local URL.

## Deploying

Copy this folder into the repository (for example as `v2/`), commit and push. GitHub Pages serves it at
`https://mattgarner9.github.io/cct/v2/`. All paths are relative, so the folder also works if you later move it to the repo root.

## Old pages to new scenario URLs

Append the path to `https://mattgarner9.github.io/cct/v2/`.

| Old page | New URL |
|---|---|
| about.html | scenario.html?scenario=guide-basic-t1016 |
| about2.html | scenario.html?scenario=chat-autostart |
| about3.html | scenario.html?scenario=guide-2btn-rageclick |
| about4.html | scenario.html?scenario=guide-proactive-offer |
| about5.html | scenario.html?scenario=guide-3btn-menu |
| about6.html | scenario.html?scenario=events-template-only |
| about7.html | scenario.html?scenario=events-all-guide |
| about8.html | scenario.html?scenario=guide-1btn-redesign |
| about9.html | scenario.html?scenario=copilot-1btn-redesign |

## Credits

Hero photo: Arvind Vallabh on Unsplash.
