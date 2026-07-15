import { createPermissionsAbstraction } from "@webiny/api-core/exports/api/security.js";
import { SCHEDULER_PERMISSIONS_SCHEMA } from "../../domain/permissionsSchema.js";
const SchedulerPermissions = createPermissionsAbstraction(SCHEDULER_PERMISSIONS_SCHEMA);
export { SchedulerPermissions };

//# sourceMappingURL=abstractions.js.map