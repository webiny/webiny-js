import { normalize } from "node:path";
import { transformSvg } from "./transformSvg.js";

/**
 * Rspack loader that turns an SVG file into a React component module.
 * Port of `@rsbuild/plugin-svgr`'s loader, without `@svgr/core`.
 */
export default function svgrLoader(contents) {
    this.cacheable();
    const callback = this.async();
    const options = this.getOptions();
    const filePath = normalize(this.resourcePath);

    // When another loader (the asset loader in mixed-import mode) ran first,
    // `contents` is its JS output. Keep it as the default export and read the
    // SVG from disk.
    const previousExport = (() => {
        if (contents.startsWith("export ")) {
            return contents;
        }
        const exportMatches = contents.match(/^module.exports\s*=\s*(.*)/);
        return exportMatches ? `export default ${exportMatches[1]}` : null;
    })();

    const run = svg => {
        try {
            callback(null, transformSvg(svg, { ...options, previousExport, filePath }));
        } catch (err) {
            callback(err);
        }
    };

    if (!previousExport) {
        run(contents);
        return;
    }

    this.fs.readFile(this.resourcePath, (err, result) => {
        if (err) {
            callback(err);
            return;
        }
        run(String(result));
    });
}
