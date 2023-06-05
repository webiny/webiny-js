import { FilePermission } from "~/types";

const FULL_ACCESS_NAMES = ["*", "fm.*"];

export const hasFullAccess = (permissions: FilePermission[]): boolean => {
    // First pass - check if we have full access to Page Builder.
    return permissions.some(p => FULL_ACCESS_NAMES.includes(p.name));
};
