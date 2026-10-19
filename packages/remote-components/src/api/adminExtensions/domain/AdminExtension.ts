/*
 * What the admin can be extended with at runtime. Config kinds are stored as JSON and rendered by a
 * component Webiny ships; code kinds are stored as source and compiled before they are saved.
 */
export const ADMIN_EXTENSION_KINDS = ["menu", "fieldRenderer"] as const;

export type AdminExtensionKind = (typeof ADMIN_EXTENSION_KINDS)[number];

/*
 * The contract a stored extension was written against. Stored source outlives the runtime that runs
 * it, so the loader compares this against what it supports instead of running something it may no
 * longer understand. Bump it whenever the shape of `source` or the injected runtime changes.
 */
export const ADMIN_EXTENSION_RUNTIME_VERSION = 1;

/* Shape of an admin extension as stored in the CMS (nested values). */
export interface AdminExtensionValues {
    kind: AdminExtensionKind;
    name: string;
    label: string;
    description: string;
    enabled: boolean;
    runtimeVersion: number;
    source: string;
}

export interface AdminExtension extends AdminExtensionValues {
    id: string;
    createdOn: string;
    savedOn: string;
}
