# Document generators

`build_docs.js` builds the Word (`.docx`) versions of the field guides from the
Markdown in `docs/`, so the printed and on-screen versions cannot drift apart.

**The Markdown files are the source of truth.** Edit those, never the `.docx`.

## Regenerate

Requires the `docx` npm package once:

```bash
npm install docx
node docs/generators/build_docs.js
```

Output:

| From | To |
| --- | --- |
| `INSTALL_GUIDE.md` | `MCA_SAMS_Install_Guide.docx` |
| `INTERVIEWER_GUIDE.md` | `MCA_SAMS_Interviewer_Guide.docx` |
| `SUPERVISOR_GUIDE.md` | `MCA_SAMS_Supervisor_Guide.docx` |

Re-run after editing any guide, then commit the updated `.docx` files.

## What it renders

Headings, paragraphs (including Markdown's wrapped lines, rejoined), bullet and
numbered lists, `- [ ]` checklists, tables, block quotes, fenced code and inline
`**bold**` / `*italic*` / `` `code` ``. Links are flattened to their label — a
printed guide cannot be clicked.
