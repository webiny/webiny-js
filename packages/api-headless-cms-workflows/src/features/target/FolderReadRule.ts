/**
 * Folder content read of the current identity, decided from folder permissions loaded once for
 * many checks (Q79), instead of one `getFolderLevelPermissions` read per check. Used by the
 * access checks (`CmsEntryAccess`, `WbPageAccess`) for bulk and candidate checks.
 */
export interface FolderReadRule {
    /** Whether the current identity can read content in the folder (never the root folder). */
    canReadFolder(folderId: string): Promise<boolean>;
}
