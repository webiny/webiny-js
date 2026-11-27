/**
 * Rsbuild plugin that lets SVG files be imported as React components.
 *
 * Port of `@rsbuild/plugin-svgr@2.0.5`, cut down to the options Webiny uses.
 * We replaced it because it pins `@svgr/core@8.1.0`, which pulls in the
 * deprecated `snake-case` package. Output is byte-identical to the original.
 *
 * Imports it supports:
 *   import url, { ReactComponent } from "./icon.svg";  (mixedImport: true)
 *   import Icon from "./icon.svg?react";
 *   import url from "./icon.svg?url";
 *   import dataUri from "./icon.svg?inline";
 *   import markup from "./icon.svg?raw";
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PLUGIN_REACT_NAME } from "@rsbuild/plugin-react";

const SVG_REGEX = /\.svg$/;
const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILENAME);
const LOADER = path.join(DIRNAME, "loader.js");
const ASSET_LOADER = path.join(DIRNAME, "assetLoader.js");

/*
 * Keep the original plugin's name: rslib's asset plugin orders itself after
 * "rsbuild:svgr" and patches the SVG rules it creates.
 */
export const PLUGIN_SVGR_NAME = "rsbuild:svgr";

/**
 * @param {object} [options]
 * @param {boolean} [options.mixedImport] Default export is the URL, named export is the component.
 * @param {object} [options.svgrOptions]
 * @param {"default" | "named"} [options.svgrOptions.exportType]
 * @param {string} [options.svgrOptions.namedExport] Defaults to "ReactComponent".
 * @returns {import("@rsbuild/core").RsbuildPlugin}
 */
export const pluginSvgr = (options = {}) => ({
    name: PLUGIN_SVGR_NAME,
    pre: [PLUGIN_REACT_NAME],
    setup(api) {
        api.modifyBundlerChain((chain, { CHAIN_ID, environment }) => {
            const { dataUriLimit } = environment.config.output;
            const maxSize = typeof dataUriLimit === "number" ? dataUriLimit : dataUriLimit.svg;

            // Take over Rsbuild's built-in SVG rule, keeping its output filename.
            let generatorOptions = {};
            if (chain.module.rules.has(CHAIN_ID.RULE.SVG)) {
                generatorOptions = chain.module.rules
                    .get(CHAIN_ID.RULE.SVG)
                    .oneOfs.get(CHAIN_ID.ONE_OF.SVG_URL)
                    .get("generator");
                chain.module.rules.delete(CHAIN_ID.RULE.SVG);
            }

            const { mixedImport = false } = options;
            const svgrOptions = options.svgrOptions || {};
            const rule = chain.module.rule(CHAIN_ID.RULE.SVG).test(SVG_REGEX);

            rule.oneOf(CHAIN_ID.ONE_OF.SVG_URL)
                .type("asset/resource")
                .resourceQuery(/^\?url$/)
                .set("generator", generatorOptions);

            rule.oneOf(CHAIN_ID.ONE_OF.SVG_INLINE)
                .type("asset/inline")
                .resourceQuery(/^\?inline$/);

            if (CHAIN_ID.ONE_OF.SVG_TEXT) {
                rule.oneOf(CHAIN_ID.ONE_OF.SVG_TEXT).type("asset/source").with({ type: "text" });
            }

            if (CHAIN_ID.ONE_OF.SVG_RAW) {
                rule.oneOf(CHAIN_ID.ONE_OF.SVG_RAW)
                    .type("asset/source")
                    .resourceQuery(/^\?raw$/);
            }

            rule.oneOf(CHAIN_ID.ONE_OF.SVG_REACT)
                .type("javascript/auto")
                .resourceQuery(/react/)
                .use(CHAIN_ID.USE.SVGR)
                .loader(LOADER)
                .options({ ...svgrOptions, exportType: "default" });

            if (mixedImport || svgrOptions.exportType) {
                const exportType = svgrOptions.exportType ?? (mixedImport ? "named" : undefined);
                const svgRule = rule.oneOf(CHAIN_ID.ONE_OF.SVG);

                svgRule
                    .type("javascript/auto")
                    .set("issuer", [/\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/, /\.mdx$/])
                    .use(CHAIN_ID.USE.SVGR)
                    .loader(LOADER)
                    .options({ ...svgrOptions, exportType });

                if (mixedImport && exportType === "named") {
                    svgRule
                        .use(CHAIN_ID.USE.URL)
                        .loader(ASSET_LOADER)
                        .options({ limit: maxSize, name: generatorOptions?.filename });
                }
            }

            rule.oneOf(CHAIN_ID.ONE_OF.SVG_ASSET)
                .type("asset")
                .parser({ dataUrlCondition: { maxSize } })
                .set("generator", generatorOptions);

            /*
             * The loader emits JSX, so run the project's JS loader (SWC or Babel)
             * after it. React Refresh is turned off for these modules.
             */
            const jsMainRule = chain.module.rules
                .get(CHAIN_ID.RULE.JS)
                .oneOfs.get(CHAIN_ID.ONE_OF.JS_MAIN);

            for (const jsUseId of [CHAIN_ID.USE.SWC, CHAIN_ID.USE.BABEL]) {
                const use = jsMainRule.uses.get(jsUseId);
                if (!use) {
                    continue;
                }

                for (const oneOfId of [CHAIN_ID.ONE_OF.SVG, CHAIN_ID.ONE_OF.SVG_REACT]) {
                    if (!rule.oneOfs.has(oneOfId)) {
                        continue;
                    }

                    let loaderOptions = use.get("options");
                    if (jsUseId === CHAIN_ID.USE.SWC) {
                        loaderOptions = {
                            ...loaderOptions,
                            jsc: {
                                ...loaderOptions?.jsc,
                                transform: {
                                    ...loaderOptions?.jsc?.transform,
                                    react: {
                                        ...loaderOptions?.jsc?.transform?.react,
                                        refresh: false
                                    }
                                }
                            }
                        };
                    }

                    const jsLoader = use.get("loader");
                    rule.oneOf(oneOfId)
                        .use(jsUseId)
                        .before(CHAIN_ID.USE.SVGR)
                        .loader(jsLoader)
                        .options(loaderOptions);
                }
                break;
            }
        });
    }
});
