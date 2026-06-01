import fs from "fs";
import path from "path";
import type { Plugin } from "vite";
import type { AcceptedPlugin } from "postcss";
import postcss from "postcss";
import postcssImport from "postcss-import";

const buildThemeCss = async (entry: string): Promise<string> => {
    const raw = fs.readFileSync(entry, "utf8");
    const result = await postcss([postcssImport() as AcceptedPlugin]).process(raw, {
        from: entry
    });
    return result.css;
};

/**
 * Vite plugin that injects compiled theme CSS as a global constant.
 *
 * Equivalent of the webpack `injectThemeCss` export from `@webiny/website-builder-nextjs/webpack`,
 * but targeting Vite / Nuxt projects.
 *
 * The plugin reads `entry` (a CSS file), inlines all `@import` statements via PostCSS, then
 * exposes the result as the constant `variableName` (default: `__THEME_CSS__`). Use it in your
 * theme definition:
 *
 * ```ts
 * // src/theme/theme.ts
 * declare const __THEME_CSS__: string;
 * export const theme = createTheme({ css: __THEME_CSS__, fonts: [...], ... });
 * ```
 *
 * Register in `nuxt.config.ts`:
 *
 * ```ts
 * import { injectThemeCss } from "@webiny/website-builder-nuxt/vite";
 *
 * export default defineNuxtConfig({
 *   vite: {
 *     plugins: [await injectThemeCss("./src/theme/theme.css")]
 *   }
 * });
 * ```
 *
 * In development mode the plugin watches the entry file and restarts the Vite dev server
 * automatically when the CSS changes (required because Vite evaluates `define` replacements
 * at server startup rather than on every request).
 */
export const injectThemeCss = async (entry: string, variableName?: string): Promise<Plugin> => {
    const defineKey = variableName ?? "__THEME_CSS__";
    let css = await buildThemeCss(entry);

    return {
        name: "webiny-inject-theme-css",

        /**
         * Expose the CSS as a global define so that any `__THEME_CSS__` (or custom key)
         * reference in source files is replaced with the CSS string at build time.
         */
        config() {
            return {
                define: {
                    [defineKey]: JSON.stringify(css)
                }
            };
        },

        /**
         * In dev mode: watch the entry file for changes and restart the dev server so
         * that the updated CSS value is picked up by the `define` replacement above.
         */
        configureServer(server) {
            const resolvedEntry = path.resolve(entry);
            server.watcher.add(resolvedEntry);

            server.watcher.on("change", async file => {
                if (path.resolve(file) !== resolvedEntry) {
                    return;
                }

                try {
                    css = await buildThemeCss(entry);
                    // Restart so the new `define` value is applied.
                    await server.restart();
                } catch (err) {
                    console.error("[webiny] Failed to rebuild theme CSS:", err);
                }
            });
        }
    };
};
