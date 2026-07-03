import { createReactPulumiApp } from "~/pulumi/apps/index.js";
import { getProjectSdk } from "@webiny/project";
import { AdminPulumi, SetAdminCustomDomains } from "~/abstractions/features/pulumi/index.js";
import { adminPulumi } from "~/pulumi/features/AdminPulumi/index.js";
import { DefaultSetAdminCustomDomains } from "~/pulumi/features/DefaultSetAdminCustomDomains.js";
import { AdminCustomDomains as adminCustomDomainsExt } from "~/pulumi/extensions/AdminCustomDomains.js";
import { withServiceManifest } from "~/pulumi/index.js";

export type AdminPulumiApp = ReturnType<typeof createReactPulumiApp>;

export const createAdminPulumiApp = async () => {
    const sdk = await getProjectSdk();
    const projectConfig = await sdk.getProjectConfig();
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
            // Overrides must be applied via a handler, registered at the very start of the program.
            // By doing this, we're ensuring user's adjustments are not applied to late.
            sdk.getContainer().registerComposite(adminPulumi);

            // Make the `SetAdminCustomDomains` service injectable into user-defined `AdminPulumi`
            // implementations. This allows applying custom domains using dynamically created
            // Pulumi resources (e.g. ACM certificates), from within a single implementation file.
            // We register an instance (bound to the current `app`) so that user implementations
            // only need to pass the custom domain params - not the `app` itself.
            sdk.getContainer().registerInstance(
                SetAdminCustomDomains,
                new DefaultSetAdminCustomDomains(app as AdminPulumiApp)
            );

            const pulumiHandlers = sdk.getContainer().resolve(AdminPulumi);

            app.addHandler(() => {
                return pulumiHandlers.execute(app as AdminPulumiApp);
            });
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
