import type { SecurityPermission } from "@webiny/api-core/types/security.js";

const GROUP_READ: SecurityPermission = { name: "cms.contentModelGroup", rwd: "r" };
const MODEL_READ: SecurityPermission = { name: "cms.contentModel", rwd: "r" };

/** Reads every CMS entry; cannot change any. */
export const CMS_READER: SecurityPermission[] = [
    GROUP_READ,
    MODEL_READ,
    { name: "cms.contentEntry", rwd: "r" }
];

/** Reads and writes every CMS entry. */
export const CMS_WRITER: SecurityPermission[] = [
    GROUP_READ,
    MODEL_READ,
    { name: "cms.contentEntry", rwd: "rw" }
];

/** Reads, writes and deletes every CMS entry (may trash and delete content, D134). */
export const CMS_DELETER: SecurityPermission[] = [
    GROUP_READ,
    MODEL_READ,
    { name: "cms.contentEntry", rwd: "rwd" }
];

/** Entry read without model read: `canAccessEntry` alone would allow it (R72). */
export const CMS_ENTRY_READER_WITHOUT_MODEL: SecurityPermission[] = [
    GROUP_READ,
    { name: "cms.contentEntry", rwd: "r" }
];

/** Model and entry read, but the group permission lacks read: only the group check refuses. */
export const CMS_READER_WITHOUT_GROUP_READ: SecurityPermission[] = [
    { name: "cms.contentModelGroup", rwd: "w" },
    MODEL_READ,
    { name: "cms.contentEntry", rwd: "r" }
];

/** Reads and writes only the entries the identity created. */
export const CMS_OWN_WRITER: SecurityPermission[] = [
    GROUP_READ,
    MODEL_READ,
    { name: "cms.contentEntry", rwd: "rw", own: true }
];

/** Reads, writes, publishes and deletes only the entries the identity created. */
export const CMS_OWN_DELETER: SecurityPermission[] = [
    GROUP_READ,
    MODEL_READ,
    { name: "cms.contentEntry", rwd: "rwd", pw: "p", own: true }
];

export const WORKFLOWS_EDITOR: SecurityPermission = { name: "workflows", editor: true };
export const WORKFLOWS_REASSIGN: SecurityPermission = { name: "workflows", reassign: true };
