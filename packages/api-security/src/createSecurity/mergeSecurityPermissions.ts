import { Group, SecurityPermission } from "~/types";

// Rules
// ☑️ full access and namespaced full access
// ☑️ content.i18n - if no locales, means all locales, otherwise push
// rwd: "rwd"
// own: true/false
// pw: "purc"

export type MergedSecurityPermissions = SecurityPermission[];

export type SecurityPermissionsMergeHandler = (
    merged: MergedSecurityPermissions,
    currentSecurityPermission: SecurityPermission
) => boolean;

export const defaultPermissionsMergeHandlers: SecurityPermissionsMergeHandler[] = [
    function noName(merged, current) {
        if (!current.name) {
            merged.push(current);
            return false;
        }

        return true;
    },
    function fullAccess(merged, current) {
        // If one of the permissions is "*", we can stop further processing.
        if (current.name === "*") {
            merged.length = 0;
            merged.push(current);
            return false;
        }

        return true;
    },
    function namespaceFullAccess(merged, current) {
        const matchedNamespaceFullAccess = current.name?.match(/(.*\.)\*/);
        if (!matchedNamespaceFullAccess) {
            return true;
        }

        const [, namespace] = matchedNamespaceFullAccess;
        const rest = merged.filter(item => !item.name?.startsWith(namespace));

        merged.length = 0;
        merged.push(current, ...rest);

        return true;
    },
    function contentI18nLocales(merged, current) {
        const name = "content.i18n";
        if (current.name !== name) {
            return true;
        }

        const existingContentI18nPermissions = merged.filter(item => item.name === name);
        const canAccessAllLocales = existingContentI18nPermissions.some(
            item => !Array.isArray(item.locales)
        );

        if (canAccessAllLocales) {
            return true;
        }

        const locales = Array.from(
            new Set([
                ...current.locales,
                ...existingContentI18nPermissions.map(item => item.locales).flat()
            ])
        );

        const rest = merged.filter(item => item.name !== name);
        merged.length = 0;
        merged.push({ name, locales }, ...rest);

        return true;
    }
];

export const mergeSecurityPermissions = (permissions: SecurityPermission[]) => {
    const merged: MergedSecurityPermissions = [];

    // TODO: Add the ability to introduce custom handlers.

    for (let i = 0; i < permissions.length; i++) {
        const permission = permissions[i];
        for (let i = 0; i < defaultPermissionsMergeHandlers.length; i++) {
            const handler = defaultPermissionsMergeHandlers[i];
            const canContinue = handler(merged, permission);
            if (!canContinue) {
                break;
            }
        }
    }

    return merged;
};

export const mergeSecurityGroupsPermissions = (securityGroups: Group[]) => {
    const permissions = securityGroups.map(current => current.permissions).flat();
    return mergeSecurityPermissions(permissions);
};
