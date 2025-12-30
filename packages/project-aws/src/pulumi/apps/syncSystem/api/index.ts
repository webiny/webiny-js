import { getSyncSystemOutput } from "~/pulumi/apps/syncSystem/getSyncSystemOutput.js";
import { attachEventBusPermissions } from "./attachEventBusPermissions.js";
import { attachDynamoDbPermissions } from "~/pulumi/apps/syncSystem/api/attachDynamoDbPermissions.js";
import { attachS3Permissions } from "~/pulumi/apps/syncSystem/api/attachS3Permissions.js";
import { addServiceManifest } from "~/pulumi/apps/syncSystem/api/addServiceManifest.js";
import type { PulumiApp } from "@webiny/pulumi/types.js";
import type { CoreOutput } from "~/pulumi/apps/common/CoreOutput.js";
import type { WithServiceManifest } from "~/pulumi/utils/withServiceManifest.js";
import { attachCognitoPermissions } from "~/pulumi/apps/syncSystem/api/attachCognitoPermissions.js";

export interface IAttachSyncSystemParams {
    app: PulumiApp & WithServiceManifest;
    core: CoreOutput;
}

export const attachSyncSystem = async (params: IAttachSyncSystemParams) => {
    const { app, core } = params;

    const syncSystem = await getSyncSystemOutput();
    /**
     * Possibly no sync system deployed - no need to do anything at that point.
     * At this point, if sync system was deployed, and it is not anymore, all resources after this check will disappear.
     */
    if (!syncSystem) {
        console.log(`No Sync System deployed. Skipping...`);
        return;
    }
    /**
     * Permissions for Webiny system to access Sync System resources.
     */
    attachEventBusPermissions({
        app,
        syncSystem
    });
    /**
     * Permissions for Sync System to access Webiny system resources.
     */
    attachCognitoPermissions({
        app,
        syncSystem,
        core
    });
    attachDynamoDbPermissions({
        app,
        syncSystem,
        core
    });
    attachS3Permissions({
        app,
        syncSystem,
        core
    });
    /**
     * Add the Service Manifest item to the Webiny system.
     */
    addServiceManifest({
        app,
        syncSystem
    });
};
