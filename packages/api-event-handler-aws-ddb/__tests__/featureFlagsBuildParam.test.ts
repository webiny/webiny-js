import { describe, it, expect, beforeEach } from "vitest";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { createRegisterBuildParamPlugin } from "@webiny/handler";
import { BuildParam } from "@webiny/api-core/features/buildParams/abstractions.js";
import { WcpLicenseLoader } from "@webiny/api-core/features/wcp/WcpLicenseLoader.js";
import { License } from "@webiny/wcp";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import type { IFeatureFlagsDto } from "@webiny/feature-flags";
import { createAwsDdbApiHandler } from "~/createWebinyApiHandler.js";

/**
 * Features gate themselves on FeatureFlags at register() time, and FeatureFlags reaches the API as a
 * BuildParam extension. Build params used to be applied together with every other extension, AFTER
 * the features had registered, so those gates read an empty flag set: a license-granted feature
 * could not be disabled from `<Project.FeatureFlags>`.
 */
const createFeatureFlagsBuildParam = (features: IFeatureFlagsDto) => {
    class FeatureFlagsBuildParam implements BuildParam.Interface {
        key = "FeatureFlags";
        value = features;
    }

    const implementation = BuildParam.createImplementation({
        implementation: FeatureFlagsBuildParam,
        dependencies: []
    });

    // Mirrors what the ApiBuildParam extension generates into `extensions.ts`.
    return createRegisterBuildParamPlugin(ctx => {
        ctx.container.register(implementation);
    });
};

const queryRootFields = async (features: IFeatureFlagsDto) => {
    const handler = createAwsDdbApiHandler({
        extensions: () => [createFeatureFlagsBuildParam(features)],
        documentClient: getDocumentClient(),
        dbTable: process.env.DB_TABLE
    });

    const result = await handler({
        httpMethod: "POST",
        path: "/graphql",
        headers: {
            "content-type": "application/json",
            "x-tenant": "root"
        },
        requestContext: { requestId: "test-req-feature-flags" },
        body: JSON.stringify({ query: `{ __schema { queryType { fields { name } } } }` }),
        isBase64Encoded: false
    });

    const parsed = JSON.parse(String(result.body));
    const fields: { name: string }[] = parsed?.data?.__schema?.queryType?.fields ?? [];
    return fields.map(field => field.name);
};

describe("api-event-handler-aws-ddb — FeatureFlags build param", () => {
    beforeEach(() => {
        // A license that grants both features, so only the config can switch them off.
        const license = createTestWcpLicense({ recordLocking: true });
        license.package.features["auditLogs"].enabled = true;
        WcpLicenseLoader.seed(License.fromLicenseDto(license));
    });

    it("enables license-granted features when the config leaves them unset", async () => {
        const fields = await queryRootFields({});

        expect(fields).toContain("auditLogs");
        expect(fields).toContain("recordLocking");
    });

    it("disables license-granted features the config explicitly turns off", async () => {
        const fields = await queryRootFields({ auditLogs: false, recordLocking: false });

        // The schema must have built, or the assertions below would pass trivially.
        expect(fields).toContain("cms");
        expect(fields).not.toContain("auditLogs");
        expect(fields).not.toContain("recordLocking");
    });
});
