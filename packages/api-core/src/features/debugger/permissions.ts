import {
    createPermissionsAbstraction,
    createPermissionsFeature,
    type Permissions
} from "~/features/security/permissions/index.js";
import { DEBUGGER_PERMISSIONS_SCHEMA } from "./permissionsSchema.js";

export const DebuggerPermissions = createPermissionsAbstraction(DEBUGGER_PERMISSIONS_SCHEMA);

export namespace DebuggerPermissions {
    export type Interface = Permissions<typeof DEBUGGER_PERMISSIONS_SCHEMA>;
}

export const DebuggerPermissionsFeature = createPermissionsFeature(
    DEBUGGER_PERMISSIONS_SCHEMA,
    DebuggerPermissions
);
