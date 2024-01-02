import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { pickEntryMetaFields } from "~/constants";

const identityA: SecurityIdentity = { id: "a", type: "admin", displayName: "A" };
const identityB: SecurityIdentity = { id: "b", type: "admin", displayName: "B" };

describe("Content Entries - Publishing-related Entry Meta Fields", () => {
    const { manage: manageApiIdentityA } = useTestModelHandler({
        identity: identityA
    });
    const { manage: manageApiIdentityB } = useTestModelHandler({
        identity: identityB
    });

    beforeEach(async () => {
        await manageApiIdentityA.setup();
    });

    test("revision and entry-level fields should be populated correctly on publish", async () => {
        let { data: rev } = await manageApiIdentityA.createTestEntry();

        const publish = await manageApiIdentityA.publishTestEntry({ revision: rev.id });
        expect(publish.error).toBeNull();

        // Refresh.
        ({ data: rev } = await manageApiIdentityA.getTestEntry({ revision: rev.id }));

        const { data: entriesList } = await manageApiIdentityA.listTestEntries();

        const matchObject = {
            meta: {
                publishedOn: expect.toBeDateString(),
                revisionFirstPublishedOn: expect.toBeDateString(),
                revisionLastPublishedOn: expect.toBeDateString(),
                revisionFirstPublishedBy: identityA,
                revisionLastPublishedBy: identityA,
                entryFirstPublishedOn: expect.toBeDateString(),
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityA,
                entryLastPublishedBy: identityA
            }
        };

        expect(rev).toMatchObject(matchObject);
        expect(entriesList[0]).toMatchObject(matchObject);

        expect(rev.meta.revisionFirstPublishedOn).toBe(rev.meta.revisionLastPublishedOn);
        expect(rev.meta.revisionFirstPublishedOn).toBe(rev.meta.publishedOn);
        expect(rev.meta.revisionFirstPublishedBy).toEqual(rev.meta.revisionLastPublishedBy);

        expect(entriesList[0].meta.revisionLastPublishedOn).toBe(rev.meta.revisionLastPublishedOn);
        expect(entriesList[0].meta.publishedOn).toBe(rev.meta.publishedOn);
        expect(entriesList[0].meta.revisionLastPublishedBy).toEqual(
            rev.meta.revisionLastPublishedBy
        );
    });

    test("publishing a second revision should not affect the entry meta fields of the first revision", async () => {
        let { data: rev1 } = await manageApiIdentityA.createTestEntry();

        let { data: rev2 } = await manageApiIdentityA.createTestEntryFrom({
            revision: rev1.id
        });

        ({ data: rev1 } = await manageApiIdentityA.getTestEntry({ revision: rev1.id }));
        ({ data: rev2 } = await manageApiIdentityA.getTestEntry({ revision: rev2.id }));

        const publish = await manageApiIdentityB.publishTestEntry({ revision: rev2.id });
        expect(publish.error).toBeNull();

        // Refresh.
        ({ data: rev1 } = await manageApiIdentityA.getTestEntry({ revision: rev1.id }));
        ({ data: rev2 } = await manageApiIdentityA.getTestEntry({ revision: rev2.id }));
        const { data: entriesList } = await manageApiIdentityA.listTestEntries();

        expect(rev1).toMatchObject({
            meta: {
                publishedOn: null,
                revisionFirstPublishedOn: null,
                revisionLastPublishedOn: null,
                revisionFirstPublishedBy: null,
                revisionLastPublishedBy: null,
                entryFirstPublishedOn: null,
                entryLastPublishedOn: null,
                entryFirstPublishedBy: null,
                entryLastPublishedBy: null
            }
        });

        const matchObject = {
            meta: {
                publishedOn: expect.toBeDateString(),
                revisionFirstPublishedOn: expect.toBeDateString(),
                revisionLastPublishedOn: expect.toBeDateString(),
                revisionFirstPublishedBy: identityB,
                revisionLastPublishedBy: identityB,
                entryFirstPublishedOn: expect.toBeDateString(),
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityB,
                entryLastPublishedBy: identityB
            }
        };
        expect(rev2).toMatchObject(matchObject);
        expect(entriesList[0]).toMatchObject(matchObject);

        expect(rev2.meta.revisionFirstPublishedOn).toBe(rev2.meta.revisionLastPublishedOn);
        expect(rev2.meta.revisionFirstPublishedOn).toBe(rev2.meta.publishedOn);
        expect(rev2.meta.revisionFirstPublishedBy).toEqual(rev2.meta.revisionLastPublishedBy);

        expect(entriesList[0].meta.revisionFirstPublishedOn).toBe(
            rev2.meta.revisionLastPublishedOn
        );
        expect(entriesList[0].meta.revisionFirstPublishedOn).toBe(rev2.meta.publishedOn);
        expect(entriesList[0].meta.revisionFirstPublishedBy).toEqual(
            rev2.meta.revisionLastPublishedBy
        );
    });

    test("when publishing a non-latest revision, the latest revision's entry meta fields should be updated", async () => {
        const { data: rev1 } = await manageApiIdentityA.createTestEntry();

        const { data: rev2 } = await manageApiIdentityA.createTestEntryFrom({
            revision: rev1.id
        });

        const { data: rev3 } = await manageApiIdentityA.createTestEntryFrom({
            revision: rev2.id
        });

        // Publish 1️⃣
        // Let's publish the first revision.
        const publish1 = await manageApiIdentityB.publishTestEntry({ revision: rev1.id });
        expect(publish1.error).toBeNull();

        // Refresh.
        const { data: rev1AfterPublish1 } = await manageApiIdentityA.getTestEntry({
            revision: rev1.id
        });
        const { data: rev2AfterPublish1 } = await manageApiIdentityA.getTestEntry({
            revision: rev2.id
        });
        const { data: rev3AfterPublish1 } = await manageApiIdentityA.getTestEntry({
            revision: rev3.id
        });

        const { data: entriesListAfterPublish1 } = await manageApiIdentityA.listTestEntries();

        // Revision 1: all meta fields should be populated.
        expect(rev1AfterPublish1).toMatchObject({
            meta: {
                publishedOn: expect.toBeDateString(),
                revisionFirstPublishedOn: expect.toBeDateString(),
                revisionLastPublishedOn: expect.toBeDateString(),
                revisionFirstPublishedBy: identityB,
                revisionLastPublishedBy: identityB,
                entryFirstPublishedOn: expect.toBeDateString(),
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityB,
                entryLastPublishedBy: identityB
            }
        });

        // Revision 2: entry meta fields should not be populated.
        expect(rev2AfterPublish1).toMatchObject({
            meta: {
                publishedOn: null,
                revisionFirstPublishedOn: null,
                revisionLastPublishedOn: null,
                revisionFirstPublishedBy: null,
                revisionLastPublishedBy: null,
                entryFirstPublishedOn: null,
                entryLastPublishedOn: null,
                entryFirstPublishedBy: null,
                entryLastPublishedBy: null
            }
        });

        // Revision 3 (latest):  only the entry-level fields should be updated.
        expect(rev3AfterPublish1).toMatchObject({
            meta: {
                publishedOn: null,
                revisionFirstPublishedOn: null,
                revisionLastPublishedOn: null,
                revisionFirstPublishedBy: null,
                revisionLastPublishedBy: null,
                entryFirstPublishedOn: expect.toBeDateString(),
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityB,
                entryLastPublishedBy: identityB
            }
        });

        expect(entriesListAfterPublish1[0]).toMatchObject({
            meta: {
                publishedOn: null,
                revisionFirstPublishedOn: null,
                revisionLastPublishedOn: null,
                revisionFirstPublishedBy: null,
                revisionLastPublishedBy: null,
                entryFirstPublishedOn: expect.toBeDateString(),
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityB,
                entryLastPublishedBy: identityB
            }
        });

        // Publish 2️⃣
        // Let's publish the second revision, this time with `identityA`.
        const publish2 = await manageApiIdentityA.publishTestEntry({ revision: rev2.id });
        expect(publish2.error).toBeNull();

        // Refresh.
        const { data: rev1AfterPublish2 } = await manageApiIdentityA.getTestEntry({
            revision: rev1.id
        });
        const { data: rev2AfterPublish2 } = await manageApiIdentityA.getTestEntry({
            revision: rev2.id
        });
        const { data: rev3AfterPublish2 } = await manageApiIdentityA.getTestEntry({
            revision: rev3.id
        });

        const { data: entriesListAfterPublish2 } = await manageApiIdentityA.listTestEntries();

        // Revision 1: entry meta fields should be populated with old values.
        expect(rev1AfterPublish2).toMatchObject({
            meta: {
                publishedOn: expect.toBeDateString(),
                revisionFirstPublishedOn: expect.toBeDateString(),
                revisionLastPublishedOn: expect.toBeDateString(),
                revisionFirstPublishedBy: identityB,
                revisionLastPublishedBy: identityB,
                entryFirstPublishedOn: expect.toBeDateString(),
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityB,
                entryLastPublishedBy: identityB
            }
        });

        // Nothing should happen to revision 1 and its entry-level meta fields.
        expect(pickEntryMetaFields(rev1AfterPublish1)).toEqual(
            pickEntryMetaFields(rev1AfterPublish2)
        );

        // Revision 2: all meta fields should be populated.
        expect(rev2AfterPublish2).toMatchObject({
            meta: {
                publishedOn: expect.toBeDateString(),
                revisionFirstPublishedOn: expect.toBeDateString(),
                revisionLastPublishedOn: expect.toBeDateString(),
                revisionFirstPublishedBy: identityA,
                revisionLastPublishedBy: identityA,
                entryFirstPublishedOn: expect.toBeDateString(),
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityB,
                entryLastPublishedBy: identityA
            }
        });

        // Entry-level meta fields should be updated.
        expect(
            rev2AfterPublish2.meta.revisionFirstPublishedOn >
                rev1AfterPublish1.meta.revisionFirstPublishedOn
        ).toBe(true);
        expect(
            rev2AfterPublish2.meta.revisionLastPublishedOn >
                rev1AfterPublish1.meta.revisionLastPublishedOn
        ).toBe(true);
        expect(rev2AfterPublish2.meta.entryFirstPublishedOn).toBe(
            rev1AfterPublish1.meta.entryFirstPublishedOn
        );
        expect(
            rev2AfterPublish2.meta.entryLastPublishedOn >
                rev1AfterPublish1.meta.entryLastPublishedOn
        ).toBe(true);

        // In the latest revision, only the entry-level fields should be updated.
        expect(rev3AfterPublish2).toMatchObject({
            meta: {
                publishedOn: null,
                revisionFirstPublishedOn: null,
                revisionLastPublishedOn: null,
                revisionFirstPublishedBy: null,
                revisionLastPublishedBy: null,
                entryFirstPublishedOn: expect.toBeDateString(),
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityB,
                entryLastPublishedBy: identityA
            }
        });

        expect(entriesListAfterPublish2[0]).toMatchObject({
            meta: {
                publishedOn: null,
                revisionFirstPublishedOn: null,
                revisionLastPublishedOn: null,
                revisionFirstPublishedBy: null,
                revisionLastPublishedBy: null,
                entryFirstPublishedOn: expect.toBeDateString(),
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityB,
                entryLastPublishedBy: identityA
            }
        });

        // Publish 3️⃣
        // Let's publish the third revision, this time with `identityB`.
        const publish3 = await manageApiIdentityB.publishTestEntry({ revision: rev3.id });
        expect(publish3.error).toBeNull();

        // Refresh.
        const { data: rev1AfterPublish3 } = await manageApiIdentityA.getTestEntry({
            revision: rev1.id
        });
        const { data: rev2AfterPublish3 } = await manageApiIdentityA.getTestEntry({
            revision: rev2.id
        });
        const { data: rev3AfterPublish3 } = await manageApiIdentityA.getTestEntry({
            revision: rev3.id
        });

        const { data: entriesListAfterPublish3 } = await manageApiIdentityA.listTestEntries();

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
            meta: {
                publishedOn: expect.toBeDateString(),
                revisionFirstPublishedOn: expect.toBeDateString(),
                revisionLastPublishedOn: expect.toBeDateString(),
                revisionFirstPublishedBy: identityB,
                revisionLastPublishedBy: identityB,
                entryFirstPublishedOn: expect.toBeDateString(),
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityB,
                entryLastPublishedBy: identityB
            }
        });

        // Entry-level meta fields should be updated.
        expect(
            rev3AfterPublish3.meta.revisionFirstPublishedOn >
                rev2AfterPublish2.meta.revisionFirstPublishedOn
        ).toBe(true);
        expect(
            rev3AfterPublish3.meta.revisionLastPublishedOn >
                rev2AfterPublish2.meta.revisionLastPublishedOn
        ).toBe(true);
        expect(rev3AfterPublish3.meta.entryFirstPublishedOn).toBe(
            rev2AfterPublish2.meta.entryFirstPublishedOn
        );
        expect(
            rev3AfterPublish3.meta.entryLastPublishedOn >
                rev2AfterPublish2.meta.entryLastPublishedOn
        ).toBe(true);

        expect(entriesListAfterPublish3[0]).toMatchObject({
            meta: {
                publishedOn: expect.toBeDateString(),
                revisionFirstPublishedOn: expect.toBeDateString(),
                revisionLastPublishedOn: expect.toBeDateString(),
                revisionFirstPublishedBy: identityB,
                revisionLastPublishedBy: identityB,
                entryFirstPublishedOn: expect.toBeDateString(),
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityB,
                entryLastPublishedBy: identityB
            }
        });
    });

    test("unpublishing and publishing a latest revision should update lastPublished meta fields", async () => {
        const { data: rev } = await manageApiIdentityA.createTestEntry();

        const publish1 = await manageApiIdentityA.publishTestEntry({ revision: rev.id });
        expect(publish1.error).toBeNull();

        // Refresh.
        const { data: revAfterPublish1 } = await manageApiIdentityA.getTestEntry({
            revision: rev.id
        });

        const unpublish = await manageApiIdentityA.unpublishTestEntry({ revision: rev.id });
        expect(unpublish.error).toBeNull();

        // Let's publish again, this time with `identityB`.
        const { data: revAfterPublish2 } = await manageApiIdentityB.publishTestEntry({
            revision: rev.id
        });

        const { data: entriesListAfterPublish2 } = await manageApiIdentityA.listTestEntries();

        const matchObject = {
            meta: {
                publishedOn: expect.toBeDateString(),
                revisionFirstPublishedOn: revAfterPublish1.meta.revisionFirstPublishedOn,
                revisionLastPublishedOn: expect.toBeDateString(),
                revisionFirstPublishedBy: identityA,
                revisionLastPublishedBy: identityB,
                entryFirstPublishedOn: revAfterPublish1.meta.entryFirstPublishedOn,
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityA,
                entryLastPublishedBy: identityB
            }
        };

        expect(revAfterPublish2).toMatchObject(matchObject);

        expect(
            revAfterPublish2.meta.revisionLastPublishedOn >
                revAfterPublish1.meta.revisionLastPublishedOn
        ).toBe(true);
        expect(
            revAfterPublish2.meta.entryLastPublishedOn > revAfterPublish1.meta.entryLastPublishedOn
        ).toBe(true);

        expect(entriesListAfterPublish2[0]).toMatchObject(matchObject);
    });

    test("unpublishing and publishing a non-latest revision should update lastPublished meta fields on the actual revision and on the latest one", async () => {
        const { data: rev1 } = await manageApiIdentityA.createTestEntry();

        const { data: rev2 } = await manageApiIdentityA.createTestEntryFrom({
            revision: rev1.id
        });

        const { data: rev3 } = await manageApiIdentityA.createTestEntryFrom({
            revision: rev2.id
        });

        // Let's publish the first revision.
        const publish1 = await manageApiIdentityA.publishTestEntry({ revision: rev1.id });
        expect(publish1.error).toBeNull();

        // Refresh.
        const { data: rev1AfterPublish1 } = await manageApiIdentityA.getTestEntry({
            revision: rev1.id
        });

        const unpublish = await manageApiIdentityA.unpublishTestEntry({ revision: rev1.id });
        expect(unpublish.error).toBeNull();

        // Let's publish again, this time with `identityB`.
        const publish2 = await manageApiIdentityB.publishTestEntry({
            revision: rev1.id
        });
        expect(publish2.error).toBeNull();

        // Refresh.
        const { data: rev1AfterPublish2 } = await manageApiIdentityA.getTestEntry({
            revision: rev1.id
        });
        const { data: rev3AfterPublish2 } = await manageApiIdentityA.getTestEntry({
            revision: rev3.id
        });

        const { data: entriesListAfterPublish2 } = await manageApiIdentityA.listTestEntries();

        expect(rev1AfterPublish2).toMatchObject({
            meta: {
                publishedOn: expect.toBeDateString(),
                revisionFirstPublishedOn: rev1AfterPublish1.meta.revisionFirstPublishedOn,
                revisionLastPublishedOn: expect.toBeDateString(),
                revisionFirstPublishedBy: identityA,
                revisionLastPublishedBy: identityB,
                entryFirstPublishedOn: rev1AfterPublish1.meta.entryFirstPublishedOn,
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityA,
                entryLastPublishedBy: identityB
            }
        });

        const matchObject = {
            meta: {
                publishedOn: null,
                revisionFirstPublishedOn: null,
                revisionLastPublishedOn: null,
                revisionFirstPublishedBy: null,
                revisionLastPublishedBy: null,
                entryFirstPublishedOn: rev1AfterPublish2.meta.entryFirstPublishedOn,
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityA,
                entryLastPublishedBy: identityB
            }
        };

        expect(rev3AfterPublish2).toMatchObject(matchObject);
        expect(entriesListAfterPublish2[0]).toMatchObject(matchObject);
    });

    test("republishing a latest revision should only change lastPublished meta fields", async () => {
        const { data: rev } = await manageApiIdentityA.createTestEntry();

        const publish1 = await manageApiIdentityA.publishTestEntry({ revision: rev.id });
        expect(publish1.error).toBeNull();

        // Refresh.
        const { data: revAfterPublish } = await manageApiIdentityA.getTestEntry({
            revision: rev.id
        });

        const republish = await manageApiIdentityA.unpublishTestEntry({ revision: rev.id });
        expect(republish.error).toBeNull();

        // Let's publish again, this time with `identityB`.
        const { data: revAfterRepublish } = await manageApiIdentityB.republishTestEntry({
            revision: rev.id
        });

        const { data: entriesListAfterRepublish } = await manageApiIdentityA.listTestEntries();

        const matchObject = {
            meta: {
                publishedOn: expect.toBeDateString(),
                revisionFirstPublishedOn: revAfterPublish.meta.revisionFirstPublishedOn,
                revisionLastPublishedOn: expect.toBeDateString(),
                revisionFirstPublishedBy: identityA,
                revisionLastPublishedBy: identityB,
                entryFirstPublishedOn: revAfterPublish.meta.entryFirstPublishedOn,
                entryLastPublishedOn: expect.toBeDateString(),
                entryFirstPublishedBy: identityA,
                entryLastPublishedBy: identityB
            }
        };

        expect(revAfterRepublish).toMatchObject(matchObject);
        expect(entriesListAfterRepublish[0]).toMatchObject(matchObject);

        expect(
            revAfterRepublish.meta.revisionLastPublishedOn >
                revAfterPublish.meta.revisionLastPublishedOn
        ).toBe(true);
        expect(
            revAfterRepublish.meta.entryLastPublishedOn > revAfterPublish.meta.entryLastPublishedOn
        ).toBe(true);

        expect(
            entriesListAfterRepublish[0].meta.revisionLastPublishedOn >
                revAfterPublish.meta.revisionLastPublishedOn
        ).toBe(true);
        expect(
            entriesListAfterRepublish[0].meta.entryLastPublishedOn >
                revAfterPublish.meta.entryLastPublishedOn
        ).toBe(true);
    });
});
