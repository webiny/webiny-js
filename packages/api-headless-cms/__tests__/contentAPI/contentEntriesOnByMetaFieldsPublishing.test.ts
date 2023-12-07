import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { useCategoryManageHandlerV2 } from "~tests/testHelpers/useCategoryManageHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { pickEntryMetaFields } from "~/constants";

const expectIsoDate = expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };

describe("Content Entries - Publishing-related Entry Meta Fields", () => {
    const managerIdentityA = useCategoryManageHandlerV2({
        path: "manage/en-US",
        identity: identityA
    });
    const managerIdentityB = useCategoryManageHandlerV2({
        path: "manage/en-US",
        identity: identityB
    });

    beforeEach(async () => {
        await setupGroupAndModels({
            manager: managerIdentityA,
            models: ["category"]
        });
    });

    test("revision and entry-level fields should be populated correctly on publish", async () => {
        let { data: rev } = await managerIdentityA.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits"
            }
        });

        const publish = await managerIdentityA.publishCategory({ revision: rev.id });
        expect(publish.error).toBeNull();

        // Refresh.
        ({ data: rev } = await managerIdentityA.getCategory({ revision: rev.id }));

        expect(rev).toMatchObject({
            revisionFirstPublishedOn: expectIsoDate,
            revisionLastPublishedOn: expectIsoDate,
            revisionFirstPublishedBy: identityA,
            revisionLastPublishedBy: identityA,
            entryFirstPublishedOn: expectIsoDate,
            entryLastPublishedOn: expectIsoDate,
            entryFirstPublishedBy: identityA,
            entryLastPublishedBy: identityA,
            meta: {
                publishedOn: expectIsoDate
            }
        });

        expect(rev.revisionFirstPublishedOn).toBe(rev.revisionLastPublishedOn);
        expect(rev.revisionFirstPublishedOn).toBe(rev.meta.publishedOn);
        expect(rev.revisionFirstPublishedBy).toEqual(rev.revisionLastPublishedBy);
    });

    test("publishing a second revision should not affect the entry meta fields of the first revision", async () => {
        let { data: rev1 } = await managerIdentityA.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits"
            }
        });

        let { data: rev2 } = await managerIdentityA.createCategoryFrom({
            revision: rev1.id
        });

        ({ data: rev1 } = await managerIdentityA.getCategory({ revision: rev1.id }));
        ({ data: rev2 } = await managerIdentityA.getCategory({ revision: rev2.id }));

        const publish = await managerIdentityB.publishCategory({ revision: rev2.id });
        expect(publish.error).toBeNull();

        // Refresh.
        ({ data: rev1 } = await managerIdentityA.getCategory({ revision: rev1.id }));
        ({ data: rev2 } = await managerIdentityA.getCategory({ revision: rev2.id }));

        expect(rev1).toMatchObject({
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            entryFirstPublishedOn: null,
            entryLastPublishedOn: null,
            entryFirstPublishedBy: null,
            entryLastPublishedBy: null,
            meta: {
                publishedOn: null
            }
        });

        expect(rev2).toMatchObject({
            revisionFirstPublishedOn: expectIsoDate,
            revisionLastPublishedOn: expectIsoDate,
            revisionFirstPublishedBy: identityB,
            revisionLastPublishedBy: identityB,
            entryFirstPublishedOn: expectIsoDate,
            entryLastPublishedOn: expectIsoDate,
            entryFirstPublishedBy: identityB,
            entryLastPublishedBy: identityB,
            meta: {
                publishedOn: expectIsoDate
            }
        });

        expect(rev2.revisionFirstPublishedOn).toBe(rev2.revisionLastPublishedOn);
        expect(rev2.revisionFirstPublishedOn).toBe(rev2.meta.publishedOn);
        expect(rev2.revisionFirstPublishedBy).toEqual(rev2.revisionLastPublishedBy);
    });

    test("when publishing a non-latest revision, the latest revision's entry meta fields should be updated", async () => {
        const { data: rev1 } = await managerIdentityA.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits"
            }
        });

        const { data: rev2 } = await managerIdentityA.createCategoryFrom({
            revision: rev1.id
        });

        const { data: rev3 } = await managerIdentityA.createCategoryFrom({
            revision: rev2.id
        });

        // Publish 1️⃣
        // Let's publish the first revision.
        const publish1 = await managerIdentityB.publishCategory({ revision: rev1.id });
        expect(publish1.error).toBeNull();

        // Refresh.
        const { data: rev1AfterPublish1 } = await managerIdentityA.getCategory({
            revision: rev1.id
        });
        const { data: rev2AfterPublish1 } = await managerIdentityA.getCategory({
            revision: rev2.id
        });
        const { data: rev3AfterPublish1 } = await managerIdentityA.getCategory({
            revision: rev3.id
        });

        // Revision 1: all meta fields should be populated.
        expect(rev1AfterPublish1).toMatchObject({
            revisionFirstPublishedOn: expectIsoDate,
            revisionLastPublishedOn: expectIsoDate,
            revisionFirstPublishedBy: identityB,
            revisionLastPublishedBy: identityB,
            entryFirstPublishedOn: expectIsoDate,
            entryLastPublishedOn: expectIsoDate,
            entryFirstPublishedBy: identityB,
            entryLastPublishedBy: identityB,
            meta: {
                publishedOn: expectIsoDate
            }
        });

        // Revision 2: entry meta fields should not be populated.
        expect(rev2AfterPublish1).toMatchObject({
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            entryFirstPublishedOn: null,
            entryLastPublishedOn: null,
            entryFirstPublishedBy: null,
            entryLastPublishedBy: null,
            meta: {
                publishedOn: null
            }
        });

        // Revision 3 (latest):  only the entry-level fields should be updated.
        expect(rev3AfterPublish1).toMatchObject({
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            entryFirstPublishedOn: expectIsoDate,
            entryLastPublishedOn: expectIsoDate,
            entryFirstPublishedBy: identityB,
            entryLastPublishedBy: identityB,
            meta: {
                publishedOn: null
            }
        });

        // Publish 2️⃣
        // Let's publish the second revision, this time with `identityA`.
        const publish2 = await managerIdentityA.publishCategory({ revision: rev2.id });
        expect(publish2.error).toBeNull();

        // Refresh.
        const { data: rev1AfterPublish2 } = await managerIdentityA.getCategory({
            revision: rev1.id
        });
        const { data: rev2AfterPublish2 } = await managerIdentityA.getCategory({
            revision: rev2.id
        });
        const { data: rev3AfterPublish2 } = await managerIdentityA.getCategory({
            revision: rev3.id
        });

        // Revision 1: entry meta fields should be populated with old values.
        expect(rev1AfterPublish2).toMatchObject({
            revisionFirstPublishedOn: expectIsoDate,
            revisionLastPublishedOn: expectIsoDate,
            revisionFirstPublishedBy: identityB,
            revisionLastPublishedBy: identityB,
            entryFirstPublishedOn: expectIsoDate,
            entryLastPublishedOn: expectIsoDate,
            entryFirstPublishedBy: identityB,
            entryLastPublishedBy: identityB,
            meta: {
                publishedOn: expectIsoDate
            }
        });

        // Nothing should happen to revision 1 and its entry-level meta fields.
        expect(pickEntryMetaFields(rev1AfterPublish1)).toEqual(
            pickEntryMetaFields(rev1AfterPublish2)
        );

        // Revision 2: all meta fields should be populated.
        expect(rev2AfterPublish2).toMatchObject({
            revisionFirstPublishedOn: expectIsoDate,
            revisionLastPublishedOn: expectIsoDate,
            revisionFirstPublishedBy: identityA,
            revisionLastPublishedBy: identityA,
            entryFirstPublishedOn: expectIsoDate,
            entryLastPublishedOn: expectIsoDate,
            entryFirstPublishedBy: identityB,
            entryLastPublishedBy: identityA,
            meta: {
                publishedOn: expectIsoDate
            }
        });

        // Entry-level meta fields should be updated.
        expect(
            rev2AfterPublish2.revisionFirstPublishedOn > rev1AfterPublish1.revisionFirstPublishedOn
        ).toBe(true);
        expect(
            rev2AfterPublish2.revisionLastPublishedOn > rev1AfterPublish1.revisionLastPublishedOn
        ).toBe(true);
        expect(rev2AfterPublish2.entryFirstPublishedOn).toBe(
            rev1AfterPublish1.entryFirstPublishedOn
        );
        expect(
            rev2AfterPublish2.entryLastPublishedOn > rev1AfterPublish1.entryLastPublishedOn
        ).toBe(true);

        // In the latest revision, only the revision-level fields should be updated.
        expect(rev3AfterPublish2).toMatchObject({
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            entryFirstPublishedOn: expectIsoDate,
            entryLastPublishedOn: expectIsoDate,
            entryFirstPublishedBy: identityB,
            entryLastPublishedBy: identityA,
            meta: {
                publishedOn: null
            }
        });

        // Publish 3️⃣
        // Let's publish the third revision, this time with `identityB`.
        const publish3 = await managerIdentityB.publishCategory({ revision: rev3.id });
        expect(publish3.error).toBeNull();

        // Refresh.
        const { data: rev1AfterPublish3 } = await managerIdentityA.getCategory({
            revision: rev1.id
        });
        const { data: rev2AfterPublish3 } = await managerIdentityA.getCategory({
            revision: rev2.id
        });
        const { data: rev3AfterPublish3 } = await managerIdentityA.getCategory({
            revision: rev3.id
        });

        // Revision 1: nothing should happen to revision 1 and its entry-level meta fields.
        expect(pickEntryMetaFields(rev1AfterPublish1)).toEqual(
            pickEntryMetaFields(rev1AfterPublish3)
        );

        // Revision 2: nothing should happen to revision 2 and its entry-level meta fields.
        expect(pickEntryMetaFields(rev2AfterPublish2)).toEqual(
            pickEntryMetaFields(rev2AfterPublish3)
        );

        // Revision 3: all meta fields should be populated.
        expect(rev3AfterPublish3).toMatchObject({
            revisionFirstPublishedOn: expectIsoDate,
            revisionLastPublishedOn: expectIsoDate,
            revisionFirstPublishedBy: identityB,
            revisionLastPublishedBy: identityB,
            entryFirstPublishedOn: expectIsoDate,
            entryLastPublishedOn: expectIsoDate,
            entryFirstPublishedBy: identityB,
            entryLastPublishedBy: identityB,
            meta: {
                publishedOn: expectIsoDate
            }
        });

        // Entry-level meta fields should be updated.
        expect(
            rev3AfterPublish3.revisionFirstPublishedOn > rev2AfterPublish2.revisionFirstPublishedOn
        ).toBe(true);
        expect(
            rev3AfterPublish3.revisionLastPublishedOn > rev2AfterPublish2.revisionLastPublishedOn
        ).toBe(true);
        expect(rev3AfterPublish3.entryFirstPublishedOn).toBe(
            rev2AfterPublish2.entryFirstPublishedOn
        );
        expect(
            rev3AfterPublish3.entryLastPublishedOn > rev2AfterPublish2.entryLastPublishedOn
        ).toBe(true);
    });

    test("unpublishing and publishing a latest revision should update lastPublished meta fields", async () => {
        const { data: rev } = await managerIdentityA.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits"
            }
        });

        const publish1 = await managerIdentityA.publishCategory({ revision: rev.id });
        expect(publish1.error).toBeNull();

        // Refresh.
        const { data: revAfterPublish1 } = await managerIdentityA.getCategory({ revision: rev.id });

        const unpublish = await managerIdentityA.unpublishCategory({ revision: rev.id });
        expect(unpublish.error).toBeNull();

        // Let's publish again, this time with `identityB`.
        const { data: revAfterPublish2 } = await managerIdentityB.publishCategory({
            revision: rev.id
        });

        expect(revAfterPublish2).toMatchObject({
            revisionFirstPublishedOn: revAfterPublish1.revisionFirstPublishedOn,
            revisionLastPublishedOn: expectIsoDate,
            revisionFirstPublishedBy: identityA,
            revisionLastPublishedBy: identityB,
            entryFirstPublishedOn: revAfterPublish1.entryFirstPublishedOn,
            entryLastPublishedOn: expectIsoDate,
            entryFirstPublishedBy: identityA,
            entryLastPublishedBy: identityB,
            meta: {
                publishedOn: expectIsoDate
            }
        });

        expect(
            revAfterPublish2.revisionLastPublishedOn > revAfterPublish1.revisionLastPublishedOn
        ).toBe(true);
        expect(revAfterPublish2.entryLastPublishedOn > revAfterPublish1.entryLastPublishedOn).toBe(
            true
        );
    });

    test("unpublishing and publishing a non-latest revision should update lastPublished meta fields on the actual revision and on the latest one", async () => {
        const { data: rev1 } = await managerIdentityA.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits"
            }
        });

        const { data: rev2 } = await managerIdentityA.createCategoryFrom({
            revision: rev1.id
        });

        const { data: rev3 } = await managerIdentityA.createCategoryFrom({
            revision: rev2.id
        });

        // Let's publish the first revision.
        const publish1 = await managerIdentityA.publishCategory({ revision: rev1.id });
        expect(publish1.error).toBeNull();

        // Refresh.
        const { data: rev1AfterPublish1 } = await managerIdentityA.getCategory({
            revision: rev1.id
        });

        const unpublish = await managerIdentityA.unpublishCategory({ revision: rev1.id });
        expect(unpublish.error).toBeNull();

        // Let's publish again, this time with `identityB`.
        const publish2 = await managerIdentityB.publishCategory({
            revision: rev1.id
        });
        expect(publish2.error).toBeNull();

        // Refresh.
        const { data: rev1AfterPublish2 } = await managerIdentityA.getCategory({
            revision: rev1.id
        });
        const { data: rev3AfterPublish2 } = await managerIdentityA.getCategory({
            revision: rev3.id
        });

        expect(rev1AfterPublish2).toMatchObject({
            revisionFirstPublishedOn: rev1AfterPublish1.revisionFirstPublishedOn,
            revisionLastPublishedOn: expectIsoDate,
            revisionFirstPublishedBy: identityA,
            revisionLastPublishedBy: identityB,
            entryFirstPublishedOn: rev1AfterPublish1.entryFirstPublishedOn,
            entryLastPublishedOn: expectIsoDate,
            entryFirstPublishedBy: identityA,
            entryLastPublishedBy: identityB,
            meta: {
                publishedOn: expectIsoDate
            }
        });

        expect(rev3AfterPublish2).toMatchObject({
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            entryFirstPublishedOn: rev1AfterPublish2.entryFirstPublishedOn,
            entryLastPublishedOn: expectIsoDate,
            entryFirstPublishedBy: identityA,
            entryLastPublishedBy: identityB,
            meta: {
                publishedOn: null
            }
        });
    });

    test("republishing a latest revision should only change lastPublished meta fields", async () => {
        const { data: rev } = await managerIdentityA.createCategory({
            data: {
                title: "Fruits",
                slug: "fruits"
            }
        });

        const publish1 = await managerIdentityA.publishCategory({ revision: rev.id });
        expect(publish1.error).toBeNull();

        // Refresh.
        const { data: revAfterPublish } = await managerIdentityA.getCategory({ revision: rev.id });

        const republish = await managerIdentityA.unpublishCategory({ revision: rev.id });
        expect(republish.error).toBeNull();

        // Let's publish again, this time with `identityB`.
        const { data: revAfterRepublish } = await managerIdentityB.publishCategory({
            revision: rev.id
        });

        expect(revAfterRepublish).toMatchObject({
            revisionFirstPublishedOn: revAfterPublish.revisionFirstPublishedOn,
            revisionLastPublishedOn: expectIsoDate,
            revisionFirstPublishedBy: identityA,
            revisionLastPublishedBy: identityB,
            entryFirstPublishedOn: revAfterPublish.entryFirstPublishedOn,
            entryLastPublishedOn: expectIsoDate,
            entryFirstPublishedBy: identityA,
            entryLastPublishedBy: identityB,
            meta: {
                publishedOn: expectIsoDate
            }
        });

        expect(
            revAfterRepublish.revisionLastPublishedOn > revAfterPublish.revisionLastPublishedOn
        ).toBe(true);
        expect(revAfterRepublish.entryLastPublishedOn > revAfterPublish.entryLastPublishedOn).toBe(
            true
        );
    });
});
