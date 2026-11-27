/**
 * Turns SVG markup into a React component module.
 *
 * This does what `@svgr/core` does with the svgo and jsx plugins, minus the
 * `.svgrrc` / `svgo.config.js` lookup, which Webiny never used. We call the
 * SVGR building blocks directly because `@svgr/core@8.1.0` (still the latest
 * release) depends on the deprecated `snake-case`.
 */
import path from "node:path";
import camelCase from "camelcase";
import { optimize } from "svgo";
import { parse } from "svg-parser";
import hastToBabelAst from "@svgr/hast-util-to-babel-ast";
import svgrBabelPreset from "@svgr/babel-preset";
import { createConfigItem } from "@babel/core";
import { transformFromAstSync } from "@babel/core";

export const DEFAULT_SVGO_CONFIG = {
    plugins: [
        {
            name: "preset-default",
            params: { overrides: { removeViewBox: false } }
        },
        "prefixIds"
    ]
};

const VALID_CHAR_REGEX = /[^a-zA-Z0-9 _-]/g;

const getComponentName = filePath => {
    if (!filePath) {
        return "SvgComponent";
    }
    const name = path.parse(filePath).name.replace(VALID_CHAR_REGEX, "");
    return `Svg${camelCase(name, { pascalCase: true })}`;
};

/**
 * @param {string} code
 * @param {object} options
 * @param {"default" | "named"} [options.exportType]
 * @param {string} [options.namedExport]
 * @param {object} [options.svgoConfig]
 * @param {string | null} [options.previousExport]
 * @param {string} [options.filePath]
 */
export const transformSvg = (code, options = {}) => {
    const {
        exportType = "default",
        namedExport = "ReactComponent",
        svgoConfig = DEFAULT_SVGO_CONFIG,
        previousExport = null,
        filePath
    } = options;

    const svg = String(code).replace("\0", "");
    const optimized = optimize(svg, {
        ...svgoConfig,
        path: filePath
    });

    const hastTree = parse(optimized.data);
    const babelTree = hastToBabelAst(hastTree);

    // Same values as `@svgr/core`'s DEFAULT_CONFIG.
    const presetOptions = {
        ref: false,
        titleProp: false,
        descProp: false,
        expandProps: "end",
        dimensions: true,
        icon: false,
        native: false,
        typescript: false,
        memo: false,
        exportType,
        namedExport,
        jsxRuntime: "classic",
        importSource: "react",
        jsxRuntimeImport: { namespace: "React", source: "react" },
        state: {
            componentName: getComponentName(filePath),
            filePath,
            caller: { name: "@webiny/build-tools", previousExport }
        }
    };

    const preset = createConfigItem([svgrBabelPreset, presetOptions], { type: "preset" });
    const result = transformFromAstSync(babelTree, optimized.data, {
        caller: { name: "svgr" },
        presets: [preset],
        filename: filePath || "unknown",
        babelrc: false,
        configFile: false,
        code: true,
        ast: false,
        inputSourceMap: false
    });

    if (!result?.code) {
        throw new Error(`Unable to generate a React component from "${filePath}".`);
    }

    return result.code;
};
