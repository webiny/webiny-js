import { describe, expect, it } from "vitest";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import { createContextHandler } from "~tests/__helpers/handler.js";

interface IntrospectionNamedRow {
    name: string;
}

interface IntrospectionTypeRow {
    name: string;
    fields: IntrospectionNamedRow[] | null;
}

interface IntrospectionSchemaRow {
    types: IntrospectionTypeRow[];
}

interface IntrospectionData {
    __schema: IntrospectionSchemaRow;
}

interface IntrospectionBody {
    data: IntrospectionData;
}

describe("workflows GraphQL without the license", () => {
    it("adds no workflows type or root field without advancedPublishingWorkflow (R100)", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.APW] = { enabled: false };
        const { introspect } = await createContextHandler({ testProjectLicense: license });

        const [body] = await introspect();
        const introspection: IntrospectionBody = body;
        const types = introspection.data.__schema.types;

        expect(types.filter(type => type.name.startsWith("Workflows"))).toEqual([]);
        for (const root of ["Query", "Mutation"]) {
            const fields = types.find(type => type.name === root)?.fields ?? [];
            expect(fields.map(field => field.name)).not.toContain("workflows");
        }
    });
});
