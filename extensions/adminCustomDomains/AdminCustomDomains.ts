import * as aws from "@pulumi/aws";
import { Ui } from "webiny/infra";
import { AdminPulumi, SetAdminCustomDomains } from "webiny/infra/admin";

/* The custom domain we want to point at the admin app's CloudFront distribution. */
const ADMIN_DOMAIN = "admin.adriaweb.xyz";

/*
 * Whether to actually attach the custom domain to the CloudFront distribution.
 *
 * CloudFront only accepts an ACM certificate that has already been ISSUED, and because
 * adriaweb.xyz is managed on Namecheap (not Route 53), Pulumi cannot create the DNS
 * validation records automatically. So we use a two-pass flow:
 *
 *   Pass 1 (default): create the certificate and print its DNS validation record(s).
 *                     Add those CNAME record(s) in Namecheap and wait until ACM reports
 *                     the certificate as "Issued".
 *   Pass 2: set ADMIN_CUSTOM_DOMAIN_ATTACH=true and redeploy to attach the domain.
 */
const SHOULD_ATTACH = process.env.ADMIN_CUSTOM_DOMAIN_ATTACH === "true";

class AdminCustomDomainsHandler implements AdminPulumi.Interface {
    constructor(
        private setCustomDomains: SetAdminCustomDomains.Interface,
        private ui: Ui.Interface
    ) {}

    execute(app: AdminPulumi.Params) {
        /* CloudFront requires the certificate to live in us-east-1, regardless of the
         * project's default region (eu-central-1 here), so we use a dedicated provider. */
        const usEast1 = new aws.Provider("admin-acm-us-east-1", { region: "us-east-1" });

        /* Provision the certificate dynamically, using DNS validation. */
        const certificate = app.addResource(aws.acm.Certificate, {
            name: "admin-custom-domain-cert",
            config: {
                domainName: ADMIN_DOMAIN,
                validationMethod: "DNS"
            },
            opts: { provider: usEast1 }
        });

        /* Surface the DNS validation record(s) as stack outputs so they can be copied
         * into Namecheap. These are printed at the end of a successful deploy. */
        app.addOutputs({
            adminCustomDomain: ADMIN_DOMAIN,
            adminCustomDomainCertArn: certificate.output.arn,
            adminCustomDomainValidationRecords: certificate.output.domainValidationOptions.apply(
                options =>
                    options.map(option => ({
                        name: option.resourceRecordName,
                        type: option.resourceRecordType,
                        value: option.resourceRecordValue
                    }))
            )
        });

        if (!SHOULD_ATTACH) {
            this.ui.info(
                `🔐 Provisioning ACM certificate for "%s". After this deploy, add the printed ` +
                    `"adminCustomDomainValidationRecords" CNAME(s) in Namecheap, wait until the ` +
                    `certificate is issued, then redeploy with ADMIN_CUSTOM_DOMAIN_ATTACH=true.`,
                ADMIN_DOMAIN
            );
            return;
        }

        /* Attach the domain + certificate to the admin CloudFront distribution. */
        this.ui.info(`🌐 Attaching custom domain "%s" to the admin app.`, ADMIN_DOMAIN);
        this.setCustomDomains.execute({
            domains: [ADMIN_DOMAIN],
            acmCertificateArn: certificate.output.arn,
            sslSupportMethod: "sni-only"
        });
    }
}

export default AdminPulumi.createImplementation({
    implementation: AdminCustomDomainsHandler,
    dependencies: [SetAdminCustomDomains, Ui]
});
