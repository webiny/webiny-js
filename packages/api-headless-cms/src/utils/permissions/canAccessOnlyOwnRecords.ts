import { BaseCmsSecurityPermission } from "~/types";
import {canAccessAllRecords} from "./canAccessAllRecords";

export const canAccessOnlyOwnRecords = (permissions: BaseCmsSecurityPermission[]): boolean => {
    return !canAccessAllRecords(permissions);
};
