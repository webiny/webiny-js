import type { PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";
import { getSyncSystemOutput } from "~/pulumi/apps/syncSystem/getSyncSystemOutput.js";

export type SyncSystemOutput = PulumiAppModule<typeof SyncSystemOutput>;

export const SyncSystemOutput = createAppModule({
    name: "SyncSystemOutput",
    config(app) {
        return app.addHandler(async () => {
            const output = await getSyncSystemOutput();

            const keys = Object.keys(output || {});

            if (keys.length === 0) {
                console.log("Sync System application is not deployed.");
                return null;
            }
            return output;
        });
    }
});
