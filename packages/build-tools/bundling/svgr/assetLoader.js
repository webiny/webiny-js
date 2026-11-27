import path from "node:path";
import { Buffer } from "node:buffer";
import { interpolateName } from "loader-utils";

const SVG_MIME_TYPE = "image/svg+xml";
const HASH_TEMPLATE_REGEX = /\[(?:[^:\]]+:)?(?:hash|contenthash)(?::[^\]]+)?]/i;

const normalizePath = value => value.replace(/\\/g, "/");

/**
 * Emits the SVG as a URL (or a data URI under `limit`) for the default export
 * in mixed-import mode. Port of `@rsbuild/plugin-svgr`'s asset loader.
 */
export default function assetLoader(content) {
    const { limit, name, publicPath } = this.getOptions();
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");

    if (buffer.length <= limit) {
        const dataUrl = `data:${SVG_MIME_TYPE};base64,${buffer.toString("base64")}`;
        return `export default ${JSON.stringify(dataUrl)}`;
    }

    const filename = interpolateName(this, name, {
        context: this.rootContext,
        content: buffer
    });

    const relativePath = path.relative(this.rootContext, this.resourcePath);
    const assetInfo = {
        sourceFilename: normalizePath(relativePath)
    };
    if (typeof name === "string" && HASH_TEMPLATE_REGEX.test(name)) {
        assetInfo.immutable = true;
    }

    this.emitFile(filename, buffer, undefined, assetInfo);

    return `export default ${getPublicPathCode(publicPath, filename, this)};`;
}

/*
 * rslib passes a `publicPath` function in bundleless builds, so the URL
 * becomes a relative import of the emitted file.
 */
const getPublicPathCode = (publicPath, filename, loaderContext) => {
    if (typeof publicPath === "function") {
        const url = publicPath(filename, loaderContext.resourcePath, loaderContext.rootContext);
        return JSON.stringify(url);
    }
    if (typeof publicPath === "string") {
        const base = publicPath.endsWith("/") ? publicPath : `${publicPath}/`;
        return JSON.stringify(`${base}${filename}`);
    }
    return `__webpack_public_path__ + ${JSON.stringify(filename)}`;
};

assetLoader.raw = true;
