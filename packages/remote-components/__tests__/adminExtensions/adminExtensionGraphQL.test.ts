import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import { CreateAdminExtensionUseCase } from "~/api/adminExtensions/features/CreateAdminExtension/abstractions.js";

const FIELDS = /* GraphQL */ `
    id
    kind
    name
    label
    enabled
    runtimeVersion
    source
`;

const LIST = /* GraphQL */ `
    query List($kind: AdminExtensionKind, $enabled: Boolean) {
        adminExtensions {
            listAdminExtensions(kind: $kind, enabled: $enabled) {
                data { ${FIELDS} }
                error { code message }
            }
        }
    }
`;

const SET_ENABLED = /* GraphQL */ `
    mutation SetEnabled($id: ID!, $enabled: Boolean!) {
        adminExtensions {
            setAdminExtensionEnabled(id: $id, enabled: $enabled) {
                data { ${FIELDS} }
                error { code message }
            }
        }
    }
`;

const DELETE = /* GraphQL */ `
    mutation Delete($id: ID!) {
        adminExtensions {
            deleteAdminExtension(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

describe("admin extensions over GraphQL", () => {
    const handler = useHandler();

    const seed = async () => {
        const container = await handler.container();
        const result = await container.resolve(CreateAdminExtensionUseCase).execute({
            kind: "menu",
            name: "release-notes",
            label: "Release notes",
            source: "{}"
        });
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    };

    it("lists, disables and deletes an extension", async () => {
        const created = await seed();

        const listed = await handler.graphql({ query: LIST, variables: { kind: "menu" } });
        expect(listed.data.adminExtensions.listAdminExtensions).toEqual({
            data: [
                {
                    id: created.id,
                    kind: "menu",
                    name: "release-notes",
                    label: "Release notes",
                    enabled: true,
                    runtimeVersion: 1,
                    source: "{}"
                }
            ],
            error: null
        });

        const disabled = await handler.graphql({
            query: SET_ENABLED,
            variables: { id: created.id, enabled: false }
        });
        expect(disabled.data.adminExtensions.setAdminExtensionEnabled.data.enabled).toBe(false);

        const enabledOnly = await handler.graphql({ query: LIST, variables: { enabled: true } });
        expect(enabledOnly.data.adminExtensions.listAdminExtensions.data).toEqual([]);

        const deleted = await handler.graphql({ query: DELETE, variables: { id: created.id } });
        expect(deleted.data.adminExtensions.deleteAdminExtension).toEqual({
            data: true,
            error: null
        });

        const empty = await handler.graphql({ query: LIST });
        expect(empty.data.adminExtensions.listAdminExtensions.data).toEqual([]);
    });

    it("returns the error rather than throwing for an unknown id", async () => {
        const response = await handler.graphql({ query: DELETE, variables: { id: "missing" } });

        expect(response.data.adminExtensions.deleteAdminExtension).toMatchObject({
            data: null,
            error: { code: "AdminExtension/NotFound" }
        });
    });

    it("refuses an identity without the permission", async () => {
        const restricted = useHandler({ permissions: [{ name: "cms.*" }] });

        const response = await restricted.graphql({ query: LIST });

        expect(response.data.adminExtensions.listAdminExtensions).toMatchObject({
            data: null,
            error: { code: "AdminExtension/NotAuthorized" }
        });
    });
});
