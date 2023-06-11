import { FbFormPermission } from "~/types";
import { canAccessAllRecords } from "./canAccessAllRecords";

export const canAccessOnlyOwnRecords = (permissions: FbFormPermission[]): boolean => {
    return !canAccessAllRecords(permissions);
};
