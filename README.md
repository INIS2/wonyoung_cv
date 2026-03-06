# wonyoung_cv

Static CV template for GitHub Pages with:

- Bilingual rendering (`ko` / `en`)
- JSON-based structured data
- URL parameter filtering
- Manager page for parameter generation and JSON editing/export

## Files

- `index.html`: main CV page
- `manager.html`: manager page
- `data/resume.json`: editable CV data
- `assets/js/app.js`: CV renderer
- `assets/js/manager.js`: manager logic
- `assets/css/style.css`: styles

## URL Parameters

- `lang=ko|en`
- `name=Custom Name`
- `show=work,education,projects,awards` (section keys)
- `edu=middle+high+university` (education level filter)

Examples:

- `/`
- `/?lang=ko`
- `/?name=Jang%20Wonyoung&edu=high+university`
- `/?show=work,projects&lang=en`

## Manager

Open `/manager.html` and:

1. Toggle checkboxes and options to generate a share URL.
2. Edit JSON in the editor.
3. Click `Apply to Preview` (stores data in browser localStorage).
4. Click `Download JSON` to export updated `resume.json`.

If you want to reset local preview override, remove `resumeDataOverride` from browser localStorage.
