import { describe, expect, test } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { expectCmsNotAuthorized } from "./utils/expectNotAuthorized.js";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { CmsModel } from "@webiny/api-headless-cms/types";

const identityA = new AuthenticatedIdentity({ id: "1", type: "admin", displayName: "A" });
const identityViewer = new AuthenticatedIdentity({ id: "2", type: "admin", displayName: "V" });
const identityNoAccess = new AuthenticatedIdentity({ id: "3", type: "admin", displayName: "N" });

const ENTRY_FIELDS = /* GraphQL */ `
    data {
        id
        entryId
    }
    error {
        code
        data
        message
    }
`;

const queries = (model: CmsModel) => {
    const Entry = model.singularApiName;
    const Entries = model.pluralApiName;
    return {
        getRevisions: /* GraphQL */ `
            query GetRevisions($id: ID!) {
                result: get${Entry}Revisions(id: $id) { ${ENTRY_FIELDS} }
            }
        `,
        getByIds: /* GraphQL */ `
            query GetByIds($revisions: [ID!]!) {
                result: get${Entries}ByIds(revisions: $revisions) { ${ENTRY_FIELDS} }
            }
        `,
        getEntry: /* GraphQL */ `
            query GetEntry($revision: ID) {
                result: get${Entry}(revision: $revision) { ${ENTRY_FIELDS} }
            }
        `,
        publish: /* GraphQL */ `
            mutation Publish($revision: ID!) {
                result: publish${Entry}(revision: $revision) { ${ENTRY_FIELDS} }
            }
        `,
        unpublish: /* GraphQL */ `
            mutation Unpublish($revision: ID!) {
                result: unpublish${Entry}(revision: $revision) { ${ENTRY_FIELDS} }
            }
        `,
        republish: /* GraphQL */ `
            mutation Republish($revision: ID!) {
                result: republish${Entry}(revision: $revision) { ${ENTRY_FIELDS} }
            }
        `,
        updateRevisionDescription: /* GraphQL */ `
            mutation UpdateRevisionDescription($revision: ID!, $revisionDescription: String) {
                result: update${Entry}RevisionDescription(
                    revision: $revision
                    revisionDescription: $revisionDescription
                ) { ${ENTRY_FIELDS} }
            }
        `,
        validate: /* GraphQL */ `
            mutation Validate($revision: ID, $data: ${Entry}Input!) {
                result: validate${Entry}(revision: $revision, data: $data) {
                    data {
                        fieldId
                    }
                    error {
                        code
                        message
                    }
                }
            }
        `,
        delete: /* GraphQL */ `
            mutation Delete($revision: ID!, $options: CmsDeleteEntryOptions) {
                result: delete${Entry}(revision: $revision, options: $options) {
                    data
                    error {
                        code
                        message
                    }
                }
            }
        `,
        restore: /* GraphQL */ `
            mutation Restore($revision: ID!) {
                result: restore${Entry}FromBin(revision: $revision) { ${ENTRY_FIELDS} }
            }
        `
    };
};

describe("Folder Level Permissions - CMS entry operations (security)", () => {
    const setup = async () => {
        const gqlA = useGraphQlHandler({ identity: identityA });
        const gqlViewer = useGraphQlHandler({
            identity: identityViewer,
            permissions: [{ name: "cms.*" }]
        });
        const gqlNoAccess = useGraphQlHandler({
            identity: identityNoAccess,
            permissions: [{ name: "cms.*" }]
        });

        const modelGroup = await gqlA.cms.createTestModelGroup();
        const model = await gqlA.cms.createBasicModel({ modelGroup: modelGroup.id });

        const folder = await gqlA.aco
            .createFolder({
                data: {
                    title: "Folder A",
                    slug: "folder-a",
                    type: `cms:${model.modelId}`
                }
            })
            .then(([response]) => response.data.aco.createFolder.data);

        const entry = await gqlA.cms
            .createEntry(model, {
                data: {
                    values: { title: "Entry" },
                    wbyAco_location: { folderId: folder.id }
                }
            })
            .then(([response]) => response.data.createBasicTestModel.data);

        await gqlA.aco.updateFolder({
            id: folder.id,
            data: {
                permissions: [
                    { target: `admin:${identityViewer.id}`, level: "viewer" },
                    { target: `admin:${identityNoAccess.id}`, level: "no-access" }
                ]
            }
        });

        const run = async (
            gql: ReturnType<typeof useGraphQlHandler>,
            name: keyof ReturnType<typeof queries>,
            variables: Record<string, any>
        ) => {
            const [response] = await gql.cms.query(queries(model)[name], variables);
            return response.data.result;
        };

        return { gqlA, gqlViewer, gqlNoAccess, model, folder, entry, run };
    };

    test("a user without access to the folder cannot read entries by id or list revisions", async () => {
        const { gqlViewer, gqlNoAccess, entry, run } = await setup();

        await expect(run(gqlNoAccess, "getRevisions", { id: entry.entryId })).resolves.toEqual({
            data: [],
            error: null
        });
        await expect(run(gqlNoAccess, "getByIds", { revisions: [entry.id] })).resolves.toEqual({
            data: [],
            error: null
        });

        // A viewer can still read.
        await expect(run(gqlViewer, "getRevisions", { id: entry.entryId })).resolves.toMatchObject({
            data: [{ id: entry.id }],
            error: null
        });
        await expect(run(gqlViewer, "getByIds", { revisions: [entry.id] })).resolves.toMatchObject({
            data: [{ id: entry.id }],
            error: null
        });
        await expect(run(gqlViewer, "getEntry", { revision: entry.id })).resolves.toMatchObject({
            data: { id: entry.id },
            error: null
        });
    });

    test("a user without access to the folder cannot validate an entry in it", async () => {
        const { gqlNoAccess, entry, run } = await setup();

        await expect(
            run(gqlNoAccess, "validate", {
                revision: entry.id,
                data: { values: { title: "x" } }
            })
        ).resolves.toMatchObject({
            error: { code: "Cms/Entry/NotAuthorized" }
        });
    });

    test("a viewer cannot publish, unpublish, republish or change the revision description", async () => {
        const { gqlA, gqlViewer, gqlNoAccess, entry, run } = await setup();

        await expectCmsNotAuthorized(run(gqlViewer, "publish", { revision: entry.id }));
        await expectCmsNotAuthorized(run(gqlNoAccess, "publish", { revision: entry.id }));
        await expectCmsNotAuthorized(
            run(gqlViewer, "updateRevisionDescription", {
                revision: entry.id,
                revisionDescription: "hijacked"
            })
        );

        // The owner publishes; viewer still cannot unpublish / republish.
        await expect(run(gqlA, "publish", { revision: entry.id })).resolves.toMatchObject({
            data: { id: entry.id },
            error: null
        });

        await expectCmsNotAuthorized(run(gqlViewer, "republish", { revision: entry.id }));
        await expectCmsNotAuthorized(run(gqlViewer, "unpublish", { revision: entry.id }));
        await expectCmsNotAuthorized(run(gqlNoAccess, "unpublish", { revision: entry.id }));

        await expect(run(gqlA, "unpublish", { revision: entry.id })).resolves.toMatchObject({
            data: { id: entry.id },
            error: null
        });
    });

    test("a viewer cannot restore an entry from the bin into the folder", async () => {
        const { gqlA, gqlViewer, entry, run } = await setup();

        // Move to the bin (entry id without a version, not permanently).
        await expect(
            run(gqlA, "delete", { revision: entry.entryId, options: { permanently: false } })
        ).resolves.toMatchObject({
            data: true,
            error: null
        });

        await expectCmsNotAuthorized(run(gqlViewer, "restore", { revision: entry.entryId }));

        await expect(run(gqlA, "restore", { revision: entry.entryId })).resolves.toMatchObject({
            data: { id: entry.id },
            error: null
        });
    });
});
