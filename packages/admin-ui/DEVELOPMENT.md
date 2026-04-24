# Overview

This document covers different aspects of the development process for the `@webiny/admin-ui` package.

## Tailwind CSS

Webiny's Admin app uses Tailwind CSS v4 for styling.

### Tailwind v4 Migration

As of this version, the admin-ui package has been upgraded to Tailwind CSS v4. Key changes include:

- The `@tailwind` directives have been replaced with `@import "tailwindcss/theme" layer(theme)` and `@import "tailwindcss/utilities" layer(utilities)`
- The `tailwindcss-animate` plugin has been removed as animations are now built into Tailwind v4
- SCSS syntax has been converted to pure CSS (theme.scss → theme.css)
- PostCSS configuration no longer requires passing the config object to the plugin

### Tailwind Configuration

Tailwind CSS is configured as usual, via the [`tailwind.config.js`](./tailwind.config.js) file. Among other things, this file defines the default Webiny theme, which is based on Webiny's design system. More on this in the next section.

### Default Theme

One of the main things we define via the [`tailwind.config.js`](./tailwind.config.js) file is the default theme, which is based on Webiny's design system, and which can be found in this [Figma file](https://www.figma.com/file/f0QUDWX37Kt5X53eltTRiT/Webiny-Design-System?type=design&node-id=127-26352&mode=design&t=nhoOU7NamjWvImoW-0).

But, do note that all the default theme-values are not actually defined in the `tailwind.config.js` file, but rather in the `tailwind.config.theme.js` file, which is a file that is generated from a Figma export (more on this in the next section).

### Figma To Code

Since manually transferring values from the mentioned Figma file into code has shown to be a very cumbersome process, we've created a script that basically takes a Figma export and generates all the necessary Tailwind CSS configuration.

When we say "Figma export", we basically mean exports of (1) Primitives and (2) Alias tokens, which are created by this [Export/Import Variables](https://www.figma.com/community/plugin/1256972111705530093/export-import-variables) plugin.

The exports need to be downloaded and place into the `packages/admin-ui/scripts/importFromFigma/exports` folder. Ultimately, we should end up with the following two:

1. `packages/admin-ui/scripts/importFromFigma/exports/Alias tokens.json`
2. `packages/admin-ui/scripts/importFromFigma/exports/Primitives.json`

Finally, from project root, we run the following script:

```bash
yarn webiny-admin-import-from-figma
```

First, the script will regenerate the `tailwind.config.theme.js` file, which will contain all the necessary Tailwind CSS configuration. Second, it will also regenerate the `src/theme.css` file, which contains actual values for CSS variables that are referenced in the `tailwind.config.theme.js` file.
