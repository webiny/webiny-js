import { ScheduleEntryGuard } from "@webiny/api-headless-cms-scheduler/exports/api/cms/scheduler.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { canAccessEntryFolder } from "@webiny/api-aco/features/cms/decorators/canAccessEntryFolder.js";

class ScheduleEntryFolderGuardImpl implements ScheduleEntryGuard.Interface {
    public constructor(private flp: FolderLevelPermissions.Interface) {}

    public async canSchedule({ entry }: ScheduleEntryGuard.Params): Promise<boolean> {
        if (!this.flp.canUseFolderLevelPermissions()) {
            return true;
        }

        // Scheduling a publish or unpublish changes the entry later without authorization,
        // so the folder must allow writing now, same as publishing directly.
        return canAccessEntryFolder(this.flp, entry.location?.folderId, "w");
    }
}

export const ScheduleEntryFolderGuard = ScheduleEntryGuard.createImplementation({
    implementation: ScheduleEntryFolderGuardImpl,
    dependencies: [FolderLevelPermissions]
});
