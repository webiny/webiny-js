/**
 * The S3 key of a file: every file lives under its tenant's folder. The file `key` (which may
 * include a client-provided `keyPrefix`) is always relative to that folder.
 */
export const getFileStorageKey = (tenantId: string, fileKey: string) => {
    return `tenants/${tenantId}/files/${fileKey.replace(/^\/+/, "")}`;
};
