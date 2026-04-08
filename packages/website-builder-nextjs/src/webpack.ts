import fs from "fs";
import type { WebpackPluginInstance } from "webpack";
import postcss from "postcss";
import postcssImport from "postcss-import";
import type { NextConfig } from "next";

// We're inferring the type from Next's config type.
type WebpackConfigContext = Parameters<NonNullable<NextConfig["webpack"]>>[1];

const buildThemeCss = async (entry: string) => {
    // Read CSS entry file.
    const raw = fs.readFileSync(entry, "utf8");

    // Inline local imports.
    const result = await postcss([postcssImport()]).process(raw, { from: entry });

    return result.css;
};

export const injectThemeCss = async (entry: string, variableName?: string) => {
    const defineKey = variableName ?? "__THEME_CSS__";

    const initialCss = await buildThemeCss(entry);

    // Inject as a global constant available in your app.
    let definePlugin: WebpackPluginInstance;

    const getPlugins = (context: WebpackConfigContext) => {
        const { dev, webpack } = context;

        if (!definePlugin) {
            definePlugin = new webpack.DefinePlugin({ [defineKey]: JSON.stringify(initialCss) });
        }

        const plugins: WebpackPluginInstance[] = [definePlugin];

        if (dev) {
            // Watch for changes and update plugin definitions
            plugins.push({
                apply(compiler) {
                    compiler.hooks.afterCompile.tapPromise("WatchThemeCss", async compilation => {
                        compilation.fileDependencies.add(entry);
                    });

                    compiler.hooks.beforeCompile.tapPromise("UpdateThemeCss", async () => {
                        const cssValue = await buildThemeCss(entry);
                        // Update the definitions on our specific plugin
                        definePlugin.definitions[defineKey] = JSON.stringify(cssValue);
                    });
                }
            });
        }

        return plugins;
    };

    return { getPlugins };
};
