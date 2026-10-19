import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";

/* Shape of an admin extension as stored in the CMS (nested values). */
export interface AdminExtensionValues {
    kind: AdminExtensionKind;
    name: string;
    label: string;
    description: string;
    enabled: boolean;
    runtimeVersion: number;
    source: string;
    /** Kind-specific settings as JSON. Empty for menus. */
    config: string;
    /** What the admin runs. Empty for config kinds. */
    compiled: string;
}

export interface AdminExtension extends AdminExtensionValues {
    id: string;
    createdOn: string;
    savedOn: string;
}
