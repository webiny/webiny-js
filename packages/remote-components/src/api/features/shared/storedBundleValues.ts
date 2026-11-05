import { createHash } from "node:crypto";
import type { ComponentBundle } from "~/api/bundler/types.js";

export interface StoredBundleValues {
    bundledJs: string;
    bundledJsSha256: string;
    bundledCss: string;
    bundledCssSha256: string;
}

function sha256(value: string): string {
    return createHash("sha256").update(value).digest("hex");
}

/** A validated bundle as the model stores it. The hashes are computed here, not taken from callers. */
export function storedBundleValues(bundle: ComponentBundle): StoredBundleValues {
    const bundledCss = bundle.bundledCss ?? "";
    const bundledCssSha256 = bundledCss ? sha256(bundledCss) : "";

    return {
        bundledJs: bundle.bundledJs,
        bundledJsSha256: sha256(bundle.bundledJs),
        bundledCss,
        bundledCssSha256
    };
}
