import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { minimumProtocolVersions } from "~/pulumi/apps/customDomain.js";

export const AdminCustomDomains = defineExtension({
    type: "Infra/Admin/CustomDomains",
    tags: { runtimeContext: "project" },
    description: "Configure custom domains for the Admin app.",
    paramsSchema: z.object({
        domains: z.array(z.string()).describe("List of custom domains.").min(1),
        sslMethod: z
            .enum(["sni-only", "vip"])
            .describe("The method to use for SSL/TLS certificate validation.")
            .default("sni-only"),
        certificateArn: z
            .string()
            .describe("The ARN of the SSL/TLS certificate to use for the custom domains."),
        minimumProtocolVersion: z
            .enum(minimumProtocolVersions)
            .describe(
                "The minimum TLS version viewers must support. Left to CloudFront's own default when omitted."
            )
            .optional()
    })
});
