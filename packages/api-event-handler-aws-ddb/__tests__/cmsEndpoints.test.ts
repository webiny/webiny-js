import { describe, it, expect } from "vitest";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createAwsDdbApiHandler } from "~/createWebinyApiHandler.js";

/**
 * The CMS serves three GraphQL endpoints: /cms/manage, /cms/read and /cms/preview. Each request
 * must run as the endpoint it was sent to (the schema, reference fields and the access check depend
 * on it), and only identities with the `cms.endpoint.<type>` permission may use it.
 *
 * The CMS tests build a handler per endpoint type, so they can't catch an endpoint the real API
 * stack doesn't serve; these requests go through the same handler a deployment runs.
 */

/*
 * Grants full CMS access (`cms.*`) to whoever is calling. Without the advanced access control layer,
 * that is the only CMS permission an identity keeps; finer ones such as `cms.endpoint.read` are dropped.
 */
class EndpointPermissionsAuthorizer implements Authorizer.Interface {
    async authorize(): Promise<SecurityPermission[]> {
        return [{ name: "cms.*" }];
    }
}

const grantEndpointPermissions = createRegisterExtensionPlugin(({ container }) => {
    container.register(
        Authorizer.createImplementation({
            implementation: EndpointPermissionsAuthorizer,
            dependencies: []
        })
    );
});

const SCHEMA_QUERY = `{
    query: __type(name: "Query") { fields { name } }
    mutation: __type(name: "Mutation") { fields { name } }
}`;

describe("api-event-handler-aws-ddb — CMS endpoints", () => {
    const documentClient = getDocumentClient();

    const sendRequest = async (path: string, extensions: unknown[] = []) => {
        const handler = createAwsDdbApiHandler({
            extensions: () => extensions,
            documentClient
        });
        const result = await handler({
            httpMethod: "POST",
            path,
            headers: {
                "content-type": "application/json",
                "x-tenant": "root"
            },
            requestContext: { requestId: `test-${path}` },
            body: JSON.stringify({ query: SCHEMA_QUERY }),
            isBase64Encoded: false
        });
        return { statusCode: result.statusCode, body: JSON.parse(String(result.body)) };
    };

    const fieldNames = (type: { fields: { name: string }[] } | null) => {
        return (type?.fields || []).map(field => field.name);
    };

    it.each(["manage", "read", "preview"])(
        "refuses /cms/%s without the endpoint permission",
        async type => {
            const { statusCode, body } = await sendRequest(`/cms/${type}`);

            expect(statusCode).toBe(401);
            expect(body.error.message).toBe(`Not allowed to access "${type}" endpoint.`);
        }
    );

    it("serves the manage schema on /cms/manage", async () => {
        const { statusCode, body } = await sendRequest("/cms/manage", [grantEndpointPermissions]);

        expect(statusCode).toBe(200);
        expect(body.errors).toBeUndefined();
        expect(fieldNames(body.data.query)).toContain("exportStructure");
        expect(fieldNames(body.data.mutation)).toContain("createContentModel");
    });

    it.each(["read", "preview"])("serves the read-only schema on /cms/%s", async type => {
        const { statusCode, body } = await sendRequest(`/cms/${type}`, [grantEndpointPermissions]);

        expect(statusCode).toBe(200);
        expect(body.errors).toBeUndefined();
        expect(fieldNames(body.data.query)).toContain("listContentModels");
        expect(fieldNames(body.data.query)).not.toContain("exportStructure");
        expect(fieldNames(body.data.mutation)).not.toContain("createContentModel");
    });
});
