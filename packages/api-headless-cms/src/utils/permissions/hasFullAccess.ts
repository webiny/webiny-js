import { BaseCmsSecurityPermission } from "~/types";

const FULL_ACCESS_NAMES = ["*", "cms.*"];

export const hasFullAccess = (permissions: BaseCmsSecurityPermission[]): boolean => {
    // First pass - check if we have full access to Page Builder.
    return permissions.some(p => FULL_ACCESS_NAMES.includes(p.name));
};
