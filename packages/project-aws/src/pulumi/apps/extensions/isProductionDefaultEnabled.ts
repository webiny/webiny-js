import type { z } from "zod";
import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";
import type { ExtensionComponent } from "@webiny/project/defineExtension/index.js";

type ToggleExtension = ExtensionComponent<z.ZodObject<{ enabled: z.ZodBoolean }>>;

/**
 * Resolves an on/off infra feature that is on by default for production environments only,
 * like `<Infra.DynamoDb.Pitr />` and `<Infra.S3Bucket.Versioning />`.
 *
 * An explicit `enabled` prop always wins over the production default. The upgrade script relies on
 * this: it adds `enabled={false}` to existing projects so their infrastructure does not change.
 * If the extension is registered more than once, the last one wins.
 */
export function isProductionDefaultEnabled(
    projectConfig: IProjectConfigModel,
    extension: ToggleExtension,
    isProduction: boolean
): boolean {
    const extensions = projectConfig.extensionsByType(extension);
    const last = extensions[extensions.length - 1];
    if (!last) {
        return isProduction;
    }

    return last.params.enabled;
}
