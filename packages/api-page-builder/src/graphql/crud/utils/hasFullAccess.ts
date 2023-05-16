import { PbSecurityPermission } from "~/graphql/types";

const FULL_ACCESS_NAMES = ["*", "pb.*"];

export default (permissions: PbSecurityPermission[]): boolean => {
    // First pass - check if we have full access to Page Builder.
    return permissions.some(p => FULL_ACCESS_NAMES.includes(p.name));
};
