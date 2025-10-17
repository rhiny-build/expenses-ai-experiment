# Documentation

This folder contains all project documentation for the Expense Tracker application.

## Structure

```
Documentation/
├── documentation-styles.css    # Shared stylesheet for all user documentation
├── TechnicalDocs/              # Technical specifications for developers
│   └── *.md                    # Markdown files with technical details
└── UserDocs/                   # User-facing documentation
    ├── *.html                  # Visual user guides
    ├── *.docx                  # Word documents (optional)
    └── images/                 # Screenshots and visual assets
```

## File Naming Convention

### Technical Documentation
- **Location:** `TechnicalDocs/`
- **Format:** Markdown (`.md`)
- **Naming:** `{feature name}.md`
- **Example:** `upload CSV File.md`

### User Documentation
- **Location:** `UserDocs/`
- **Format:** HTML (`.html`) or Word (`.docx`)
- **Naming:** `{feature name} - Visual Guide.html` or `{feature name}.docx`
- **Example:** `upload CSV File - Visual Guide.html`

### Images
- **Location:** `UserDocs/images/`
- **Format:** PNG, JPG, GIF
- **Naming:** Descriptive names with numbers for ordering
- **Example:** `1-main-dashboard.png`, `2-import-modal.png`

## Using the Shared Stylesheet

All HTML user documentation should use the shared `documentation-styles.css`:

```html
<link rel="stylesheet" href="../documentation-styles.css">
```

This ensures:
- ✅ Consistent styling across all documentation
- ✅ Easy maintenance - update styles in one place
- ✅ Professional, modern appearance
- ✅ Responsive design for mobile/tablet/desktop
- ✅ Print-friendly styles

## Available CSS Classes

### Layout
- `.container` - Main content wrapper (900px max-width)
- `.two-column` - Side-by-side layout
- `.gradient-hero` - Purple gradient hero section

### Components
- `.option-box` - Bordered option cards (variants: `.blue`, `.green`, `.yellow`, `.red`)
- `.info-box` - Light gray information box
- `.checklist` - Green checkmark list box
- `.warning-box` - Yellow warning box
- `.error-box` - Red error box

### Tables
- `.steps-table` - 3-step process table
- `.confidence-table` - Confidence level comparison
- `.tips-table` - Do's and don'ts comparison
- `.category-grid` - Category cards grid

### Code
- `pre` - Code blocks with dark theme
- `code` - Inline code
- `.ascii-table` - ASCII art tables

### Interactive
- `details` / `summary` - Collapsible sections
- `.footer` - Gradient footer section

### Badges
- `.badge` - Base badge style
- `.badge-success` - Green success badge
- `.badge-info` - Blue info badge
- `.badge-warning` - Yellow warning badge
- `.badge-error` - Red error badge

## Creating New Documentation

### For Technical Docs

1. Create a new `.md` file in `TechnicalDocs/`
2. Include:
   - Introduction
   - Architecture diagrams
   - Implementation details with file paths and line numbers
   - Technical challenges
   - Testing considerations
   - Troubleshooting guide

### For User Docs

1. Create a new `.html` file in `UserDocs/`
2. Link the shared stylesheet:
   ```html
   <link rel="stylesheet" href="../documentation-styles.css">
   ```
3. Use the standard structure:
   ```html
   <div class="container">
       <h1>Page Title</h1>
       <!-- Content here -->
   </div>
   ```
4. Add screenshots to `UserDocs/images/`
5. Keep content visual and scannable
6. Use existing CSS classes for consistency

## Style Guidelines

### User Documentation
- **Be concise** - Users want quick answers
- **Use visuals** - Screenshots > text
- **Progressive disclosure** - Use collapsible sections
- **Step-by-step** - Clear numbered instructions
- **Examples** - Show don't tell

### Technical Documentation
- **Be thorough** - Include all implementation details
- **Code references** - Use `file_path:line_number` format
- **Diagrams** - Visual architecture flow
- **Edge cases** - Document error handling
- **Future work** - Note enhancement opportunities

## Maintenance

When updating the shared stylesheet (`documentation-styles.css`):
1. Test changes across all documentation pages
2. Ensure responsive behavior on mobile/tablet
3. Check print styles
4. Update this README if adding new classes

## Version History

Track major documentation changes here:

- **2025-10-17** - Initial documentation structure created
  - Added `upload CSV File` technical and user documentation
  - Created shared `documentation-styles.css`
  - Established naming conventions and structure
