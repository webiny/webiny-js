import type { CorePulumiApp as CoreApp } from "~/pulumi/apps/core/createCorePulumiApp.js";
import type { ApiPulumiApp as ApiApp } from "~/pulumi/apps/api/createApiPulumiApp.js";
import type { AdminPulumiApp as AdminApp } from "~/pulumi/apps/admin/createAdminPulumiApp.js";
import type { CustomDomainParams as CustomDomains } from "~/pulumi/apps/customDomain.js";

/*
 * The AWS abstractions (`CorePulumi`, `ApiPulumi`, `AdminPulumi`, `SetApiCustomDomains`,
 * `SetAdminCustomDomains` and the rest) live in `@webiny/project`, so `webiny/infra` loads in a
 * project without this package. `@webiny/project` can't depend on Pulumi, so it declares the
 * Pulumi app types as empty interfaces, and this file fills them in. Every file in
 * `src/abstractions` imports this one, and the `webiny/infra` entry points reference it by type,
 * so it is part of any AWS project's TypeScript program.
 */
declare module "@webiny/project/abstractions/aws/features/pulumi/pulumiTypes.js" {
    interface CorePulumiApp extends CoreApp {}
    interface ApiPulumiApp extends ApiApp {}
    interface AdminPulumiApp extends AdminApp {}
    interface CustomDomainParams extends CustomDomains {}
}

// Referenced by the `webiny/infra` entry points so TypeScript loads this file in AWS projects.
export type AwsPulumiTypes = true;
