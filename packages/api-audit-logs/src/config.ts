import { getAuditObject } from "~/utils/getAuditObject";
import { App } from "~/types";

export enum ActionType {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    PUBLISH = "PUBLISH",
    UNPUBLISH = "UNPUBLISH",
    IMPORT = "IMPORT",
    EXPORT = "EXPORT"
}

const commonActions = {
    CREATE: { type: ActionType.CREATE, displayName: "Create" },
    UPDATE: { type: ActionType.UPDATE, displayName: "Update" },
    DELETE: { type: ActionType.DELETE, displayName: "Delete" }
};

const publishActions = {
    PUBLISH: { type: ActionType.PUBLISH, displayName: "Publish" },
    UNPUBLISH: { type: ActionType.UNPUBLISH, displayName: "Unpublish" }
};

const importExportActions = {
    IMPORT: { type: ActionType.IMPORT, displayName: "Import" },
    EXPORT: { type: ActionType.EXPORT, displayName: "Export" }
};

export const auditLogsApps: App[] = [
    {
        app: "APW",
        displayName: "APW",
        entities: [
            {
                type: "CHANGE_REQUEST",
                displayName: "Change Request",
                actions: [
                    commonActions.CREATE,
                    commonActions.UPDATE,
                    commonActions.DELETE,
                    { type: "MARK_RESOLVED", displayName: "Mark resolved" },
                    { type: "MARK_UNRESOLVED", displayName: "Mark unresolved" }
                ]
            },
            {
                type: "COMMENT",
                displayName: "Comment",
                actions: [commonActions.CREATE]
            },
            {
                type: "CONTENT_REVIEW",
                displayName: "Content Review",
                linkToEntity(id) {
                    return `/apw/content-reviews/${id}`;
                },
                actions: [commonActions.CREATE]
            },
            {
                type: "WORKFLOW",
                displayName: "Workflow",
                linkToEntity(id) {
                    return `/apw/publishing-workflows?id=${id}`;
                },
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            }
        ]
    },
    {
        app: "FILE_MANAGER",
        displayName: "File Manager",
        entities: [
            {
                type: "FILE",
                displayName: "File",
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            },
            {
                type: "FILE_FOLDER",
                displayName: "File folder",
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            },
            {
                type: "SETTINGS",
                displayName: "Settings",
                actions: [commonActions.UPDATE]
            }
        ]
    },
    {
        app: "FORM_BUILDER",
        displayName: "Form Builder",
        entities: [
            {
                type: "FORM",
                displayName: "Form",
                linkToEntity(id) {
                    return `/form-builder/forms?id=${id}`;
                },
                actions: [
                    commonActions.CREATE,
                    commonActions.DELETE,
                    importExportActions.EXPORT,
                    importExportActions.IMPORT
                ]
            },
            {
                type: "FORM_REVISION",
                displayName: "Form revision",
                linkToEntity(id) {
                    return `/form-builder/forms?id=${id}`;
                },
                actions: [
                    commonActions.CREATE,
                    commonActions.UPDATE,
                    commonActions.DELETE,
                    publishActions.PUBLISH,
                    publishActions.UNPUBLISH
                ]
            },
            {
                type: "FORM_SUBMISSION",
                displayName: "Form submission",
                actions: [importExportActions.EXPORT]
            },
            {
                type: "SETTINGS",
                displayName: "Settings",
                actions: [commonActions.UPDATE]
            }
        ]
    },
    {
        app: "HEADLESS_CMS",
        displayName: "Headless CMS",
        entities: [
            {
                type: "ENTRY",
                displayName: "Entry",
                actions: [commonActions.CREATE, commonActions.DELETE]
            },
            {
                type: "ENTRY_REVISION",
                displayName: "Entry revision",
                actions: [
                    commonActions.CREATE,
                    commonActions.UPDATE,
                    commonActions.DELETE,
                    publishActions.PUBLISH,
                    publishActions.UNPUBLISH
                ]
            },
            {
                type: "GROUP",
                displayName: "Group",
                linkToEntity(id) {
                    return `/cms/content-model-groups?id=${id}`;
                },
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            },
            {
                type: "MODEL",
                displayName: "Model",
                linkToEntity(modelId) {
                    return `/cms/content-models/${modelId}`;
                },
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            },
            {
                type: "MODEL_FOLDER",
                displayName: "Model folder",
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            }
        ]
    },
    {
        app: "I18N",
        displayName: "i18n",
        entities: [
            {
                type: "LOCALE",
                displayName: "Locale",
                linkToEntity(id) {
                    return `/i18n/locales?code=${id}`;
                },
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            }
        ]
    },
    {
        app: "MAILER",
        displayName: "Mailer",
        entities: [
            {
                type: "SETTINGS",
                displayName: "Settings",
                actions: [commonActions.UPDATE]
            }
        ]
    },
    {
        app: "PAGE_BUILDER",
        displayName: "Page Builder",
        entities: [
            {
                type: "BLOCK",
                displayName: "Block",
                linkToEntity(id) {
                    return `/page-builder/block-editor/${id}`;
                },
                actions: [
                    commonActions.CREATE,
                    commonActions.UPDATE,
                    commonActions.DELETE,
                    importExportActions.EXPORT,
                    importExportActions.IMPORT
                ]
            },
            {
                type: "BLOCK_CATEGORY",
                displayName: "Block category",
                linkToEntity(slug) {
                    return `/page-builder/block-categories?slug=${slug}`;
                },
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            },
            {
                type: "CATEGORY",
                displayName: "Category",
                linkToEntity(slug) {
                    return `/page-builder/categories?slug=${slug}`;
                },
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            },
            {
                type: "MENU",
                displayName: "Menu",
                linkToEntity(slug) {
                    return `/page-builder/menus?slug=${slug}`;
                },
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            },
            {
                type: "PAGE",
                displayName: "Page",
                linkToEntity(id) {
                    return `/page-builder/editor/${id}`;
                },
                actions: [
                    commonActions.CREATE,
                    commonActions.DELETE,
                    importExportActions.EXPORT,
                    importExportActions.IMPORT
                ]
            },
            {
                type: "PAGE_ELEMENT",
                displayName: "Page element",
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            },
            {
                type: "PAGE_FOLDER",
                displayName: "Page folder",
                linkToEntity(id) {
                    return `/page-builder/pages?folderId=${id}`;
                },
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            },
            {
                type: "PAGE_REVISION",
                displayName: "Page revision",
                linkToEntity(id) {
                    return `/page-builder/editor/${id}`;
                },
                actions: [
                    commonActions.CREATE,
                    { ...commonActions.UPDATE, newEntryDelay: 60 },
                    commonActions.DELETE,
                    publishActions.PUBLISH,
                    publishActions.UNPUBLISH
                ]
            },
            {
                type: "SETTINGS",
                displayName: "Settings",
                actions: [commonActions.UPDATE]
            },
            {
                type: "TEMPLATE",
                displayName: "Template",
                linkToEntity(id) {
                    return `/page-builder/page-templates?id=${id}`;
                },
                actions: [
                    commonActions.CREATE,
                    commonActions.UPDATE,
                    commonActions.DELETE,
                    importExportActions.EXPORT,
                    importExportActions.IMPORT
                ]
            }
        ]
    },
    {
        app: "SECURITY",
        displayName: "Security",
        entities: [
            {
                type: "API_KEY",
                displayName: "API Key",
                linkToEntity(id) {
                    return `/access-management/api-keys?id=${id}`;
                },
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            },
            {
                type: "ROLE",
                displayName: "Role",
                linkToEntity(id) {
                    return `/access-management/roles?id=${id}`;
                },
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            },
            {
                type: "TEAM",
                displayName: "Team",
                linkToEntity(id) {
                    return `/access-management/teams?id=${id}`;
                },
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            },
            {
                type: "USER",
                displayName: "User",
                linkToEntity(id) {
                    return `/admin-users?id=${id}`;
                },
                actions: [commonActions.CREATE, commonActions.UPDATE, commonActions.DELETE]
            }
        ]
    }
];

export const AUDIT = getAuditObject(auditLogsApps);
