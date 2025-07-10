import type { PulumiApp } from "@webiny/pulumi";
import type { IGetSyncSystemOutputResult } from "~/apps/syncSystem/types.js";
import type { WithServiceManifest } from "~/utils/withServiceManifest.js";

export interface IAddServiceManifestParams {
    app: PulumiApp & WithServiceManifest;
    syncSystem: IGetSyncSystemOutputResult;
}

export const addServiceManifest = (params: IAddServiceManifestParams) => {
    const { app, syncSystem } = params;

    app.addHandler(() => {
        app.addServiceManifest({
            name: "sync",
            manifest: {
                eventBusArn: syncSystem.eventBusArn,
                eventBusName: syncSystem.eventBusName,
                region: syncSystem.region
            }
        });
    });
};
