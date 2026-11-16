/**
 * The `type` of the record-changed message sent when a folder changes. The admin's
 * `ApplyFolderChangeToCache` filters on the same string.
 *
 * `created` and `updated` go out when the FLP tasks finish, since folder reads report permissions
 * from the FLP records. `deleted` goes out right after the delete: nothing is read back.
 */
export const FOLDER_RECORD_TYPE = "aco.folder";
