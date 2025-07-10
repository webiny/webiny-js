import { createAppModule, PulumiAppModule } from "@webiny/pulumi";
import { getSyncSystemOutput } from "~/apps/syncSystem/getSyncSystemOutput.js";

export type SyncSystemOutput = PulumiAppModule<typeof SyncSystemOutput>;

export const SyncSystemOutput = createAppModule({
    name: "SyncSystemOutput",
    config(app) {
        return app.addHandler(async () => {
            const output = getSyncSystemOutput({
                env: app.params.run.env
            });

            const keys = Object.keys(output || {});

            if (keys.length === 0) {
                console.log("Sync System application is not deployed.");
                return null;
            }
            return output;
        });
    }
});
