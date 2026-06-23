import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import zod from "zod";
import { createZodError } from "@webiny/utils";

const validateManifest = zod.object({
    sync: zod.object({
        eventBusArn: zod.string(),
        eventBusName: zod.string(),
        region: zod.string()
    })
});

export const getManifest = async () => {
    try {
        const manifest = await ServiceDiscovery.load();
        if (!manifest?.sync) {
            return {
                /*
                 * This error will be silent. We do not want to log or throw at this point.
                 */
                error: new Error(
                    "Sync System Manifest not found. Probably Sync System is not turned on."
                )
            };
        }
        const { data, error } = validateManifest.safeParse(manifest);
        if (error) {
            const err = createZodError(error);
            return {
                error: err
            };
        }
        return {
            data
        };
    } catch (ex) {
        return {
            error: ex
        };
    }
};
