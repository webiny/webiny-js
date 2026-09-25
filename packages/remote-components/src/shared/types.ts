import type { ComponentStatus } from "./componentStatus.js";

export interface RemoteComponentDto {
    id: string;
    name: string;
    label: string;
    description: string;
    aiContext: string;
    source: string;
    css: string;
    bundledJs: string;
    bundledJsSha256: string;
    bundledCss: string;
    bundledCssSha256: string;
    manifest: string;
    aiPrompt: string;
    status: ComponentStatus;
    /** Why the last bundling attempt failed. Set with `failed`, cleared on `bundled`. */
    bundleError: string;
    sdkVersion: string;
    createdOn: string;
    savedOn: string;
}
