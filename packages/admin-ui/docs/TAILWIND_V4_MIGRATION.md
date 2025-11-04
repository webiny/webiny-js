# Tailwind CSS v4 Migration Summary

This document summarizes the changes made to upgrade the `@webiny/admin-ui` package from Tailwind CSS v3 to v4.

## Changes Made

### 1. Package Dependencies
- **Updated**: `tailwindcss` from `^3.4.17` to `^4.1.14` in `package.json`
- **Removed**: `tailwindcss-animate` dependency (animations are now built into v4)

### 2. Theme File Changes
- **Renamed**: `src/theme.scss` → `src/theme.css`
- **Converted**: All SCSS comments (`//`) to CSS comments (`/* */`)
- **Updated imports**: Changed from `@tailwind` directives to v4's layer-based imports:
  ```css
  /* Before (v3) */
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  
  /* After (v4) */
  @import "tailwindcss/theme" layer(theme);
  @import "tailwindcss/utilities" layer(utilities);
  ```
- **Removed**: `@layer base` wrapper around custom CSS rules (v4 handles layers automatically)

### 3. Configuration Changes
- **Updated**: `tailwind.config.js` to remove `tailwindcss-animate` import and plugin
- **Updated**: `.storybook/main.ts` to:
  - Remove config object passed to PostCSS plugin (v4 auto-discovers config)
  - Add CSS file handling alongside SCSS
- **Updated**: `.storybook/preview.ts` to import `theme.css` instead of `theme.scss`

### 4. Script Updates
- **Updated**: `scripts/importFromFigma.js` to reference `theme.css` instead of `theme.scss`
- **Updated**: `scripts/importFromFigma/createThemeScss.js` comment to reference `theme.css`

### 5. Documentation Updates
- **Updated**: `DEVELOPMENT.md` to:
  - Note the upgrade to Tailwind CSS v4
  - Document key migration changes
  - Update references from `styles.scss` to `theme.css`

## Key Differences Between v3 and v4

### CSS Import Syntax
Tailwind v4 uses explicit layer imports instead of the generic `@tailwind` directive:
- More explicit control over which layers are included
- Better tree-shaking and smaller output bundles
- Automatic layer ordering

### Plugin System
Many plugins that were separate in v3 are now built into v4:
- Animations (previously `tailwindcss-animate`)
- Container queries
- Other utility plugins

### Configuration
The PostCSS plugin in v4 automatically discovers the `tailwind.config.js` file, so you no longer need to pass it explicitly:
```js
// v3
plugins: [tailwindcss(tailwindConfig)]

// v4
plugins: [tailwindcss]
```

### Pure CSS
Tailwind v4 expects pure CSS syntax and doesn't support SCSS-specific features like `//` comments when processing with the Tailwind CLI. This is why we converted to CSS comments.

## Testing

The changes have been validated by:
1. Successfully compiling `theme.css` with Tailwind v4 CLI
2. Verifying the output CSS contains all expected utility classes
3. Confirming `@apply` directives are properly expanded

## Next Steps

To complete the migration:
1. Test the Storybook build to ensure all components render correctly
2. Test the full admin-ui package build
3. Verify no visual regressions in the UI
4. Update any consuming packages that may need to reference the new file names

## Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
