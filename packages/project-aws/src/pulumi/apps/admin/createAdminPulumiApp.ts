import { createReactPulumiApp } from "~/pulumi/apps/index.js";
import { getProjectSdk } from "@webiny/project";
import { AdminPulumi, SetAdminCustomDomains } from "~/abstractions/features/pulumi/index.js";
import { adminPulumi } from "~/pulumi/features/AdminPulumi/index.js";
import { DefaultSetAdminCustomDomains } from "~/pulumi/features/SetAdminCustomDomains/index.js";
import { withServiceManifest } from "~/pulumi/index.js";
import { AdminCustomDomains as adminCustomDomainsExt } from "~/pulumi/extensions/AdminCustomDomains.js";

export type AdminPulumiApp = ReturnType<typeof createReactPulumiApp>;

export const createAdminPulumiApp = async () => {
    const sdk = await getProjectSdk();
    const projectConfig = await sdk.getProjectConfig();

    // Register the SetAdminCustomDomains singleton so it can be injected into AdminPulumi impls.
    sdk.getContainer().register(DefaultSetAdminCustomDomains);

    const baseApp = createReactPulumiApp({
        name: "admin",
        folder: "apps/admin",
        domains: () => {
            const [adminDomains] = projectConfig.extensionsByType(adminCustomDomainsExt);

            if (adminDomains) {
                const { domains, sslMethod, certificateArn } = adminDomains.params;
                return {
                    domains,
                    sslSupportMethod: sslMethod,
                    acmCertificateArn: certificateArn
                };
            }

            return undefined;
        },
        pulumi: async app => {
            sdk.getContainer().registerComposite(adminPulumi);
            const pulumiHandlers = sdk.getContainer().resolve(AdminPulumi);

            // Execute directly so implementations run before the CloudFront resource is created,
            // allowing them to modify cloudfront.config (e.g. via injected SetAdminCustomDomains).
            await pulumiHandlers.execute(app as AdminPulumiApp);
        }
    });

    const app = withServiceManifest(baseApp);

    app.addHandler(() => {
        app.addServiceManifest({
            name: "admin",
            manifest: {
                cloudfront: {
                    distributionId: baseApp.resources.cloudfront.output.id,
                    domain: baseApp.resources.cloudfront.output.domainName.apply(
                        v => `https://${v}`
                    )
                }
            }
        });
    });

    return app;
};
