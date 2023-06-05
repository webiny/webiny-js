import { FilePermission } from "~/types";
import { canAccessAllRecords } from "./canAccessAllRecords";

export const canAccessOnlyOwnRecords = (permissions: FilePermission[]): boolean => {
    return !canAccessAllRecords(permissions);
};
