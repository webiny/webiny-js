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
            revisionFirstPublishedOn: expect.toBeDateString(),
            revisionLastPublishedOn: expect.toBeDateString(),
            revisionFirstPublishedBy: identityA,
            revisionLastPublishedBy: identityA,
            firstPublishedOn: expect.toBeDateString(),
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityA,
            lastPublishedBy: identityA
        };

        expect(rev).toMatchObject(matchObject);
        expect(entriesList[0]).toMatchObject(matchObject);

        expect(rev.revisionFirstPublishedOn).toBe(rev.revisionLastPublishedOn);
        expect(rev.revisionFirstPublishedBy).toEqual(rev.revisionLastPublishedBy);

        expect(entriesList[0].revisionLastPublishedOn).toBe(rev.revisionLastPublishedOn);
        expect(entriesList[0].revisionLastPublishedBy).toEqual(rev.revisionLastPublishedBy);
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
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            firstPublishedOn: null,
            lastPublishedOn: null,
            firstPublishedBy: null,
            lastPublishedBy: null
        });

        const matchObject = {
            revisionFirstPublishedOn: expect.toBeDateString(),
            revisionLastPublishedOn: expect.toBeDateString(),
            revisionFirstPublishedBy: identityB,
            revisionLastPublishedBy: identityB,
            firstPublishedOn: expect.toBeDateString(),
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityB,
            lastPublishedBy: identityB
        };
        expect(rev2).toMatchObject(matchObject);
        expect(entriesList[0]).toMatchObject(matchObject);

        expect(rev2.revisionFirstPublishedOn).toBe(rev2.revisionLastPublishedOn);
        expect(rev2.revisionFirstPublishedBy).toEqual(rev2.revisionLastPublishedBy);

        expect(entriesList[0].revisionFirstPublishedOn).toBe(rev2.revisionLastPublishedOn);
        expect(entriesList[0].revisionFirstPublishedBy).toEqual(rev2.revisionLastPublishedBy);
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
            revisionFirstPublishedOn: expect.toBeDateString(),
            revisionLastPublishedOn: expect.toBeDateString(),
            revisionFirstPublishedBy: identityB,
            revisionLastPublishedBy: identityB,
            firstPublishedOn: expect.toBeDateString(),
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityB,
            lastPublishedBy: identityB
        });

        // Revision 2: entry meta fields should not be populated.
        expect(rev2AfterPublish1).toMatchObject({
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            firstPublishedOn: null,
            lastPublishedOn: null,
            firstPublishedBy: null,
            lastPublishedBy: null
        });

        // Revision 3 (latest):  only the entry-level fields should be updated.
        expect(rev3AfterPublish1).toMatchObject({
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            firstPublishedOn: expect.toBeDateString(),
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityB,
            lastPublishedBy: identityB
        });

        expect(entriesListAfterPublish1[0]).toMatchObject({
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            firstPublishedOn: expect.toBeDateString(),
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityB,
            lastPublishedBy: identityB
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
            revisionFirstPublishedOn: rev1AfterPublish1.revisionFirstPublishedOn,
            revisionLastPublishedOn: rev1AfterPublish1.revisionLastPublishedOn,
            revisionFirstPublishedBy: identityB,
            revisionLastPublishedBy: identityB,
            firstPublishedOn: rev1AfterPublish1.firstPublishedOn,
            lastPublishedOn: rev1AfterPublish1.lastPublishedOn,
            firstPublishedBy: identityB,
            lastPublishedBy: identityB
        });

        // Nothing should happen to revision 1 and its meta fields.
        expect(pickEntryMetaFields(rev1AfterPublish1)).toEqual(
            pickEntryMetaFields(rev1AfterPublish2)
        );

        // Revision 2: all meta fields should be populated.
        expect(rev2AfterPublish2).toMatchObject({
            revisionFirstPublishedOn: expect.toBeDateString(),
            revisionLastPublishedOn: expect.toBeDateString(),
            revisionFirstPublishedBy: identityA,
            revisionLastPublishedBy: identityA,
            firstPublishedOn: expect.toBeDateString(),
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityB,
            lastPublishedBy: identityA
        });

        // Entry-level meta fields should be updated.
        expect(
            rev2AfterPublish2.revisionFirstPublishedOn > rev1AfterPublish1.revisionFirstPublishedOn
        ).toBe(true);
        expect(
            rev2AfterPublish2.revisionLastPublishedOn > rev1AfterPublish1.revisionLastPublishedOn
        ).toBe(true);
        expect(rev2AfterPublish2.firstPublishedOn).toBe(rev1AfterPublish1.firstPublishedOn);
        expect(rev2AfterPublish2.lastPublishedOn > rev1AfterPublish1.lastPublishedOn).toBe(true);

        // In the latest revision, only the entry-level fields should be updated.
        expect(rev3AfterPublish2).toMatchObject({
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            firstPublishedOn: expect.toBeDateString(),
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityB,
            lastPublishedBy: identityA
        });

        expect(entriesListAfterPublish2[0]).toMatchObject({
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            firstPublishedOn: expect.toBeDateString(),
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityB,
            lastPublishedBy: identityA
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
            revisionFirstPublishedOn: expect.toBeDateString(),
            revisionLastPublishedOn: expect.toBeDateString(),
            revisionFirstPublishedBy: identityB,
            revisionLastPublishedBy: identityB,
            firstPublishedOn: expect.toBeDateString(),
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityB,
            lastPublishedBy: identityB
        });

        // Entry-level meta fields should be updated.
        expect(
            rev3AfterPublish3.revisionFirstPublishedOn > rev2AfterPublish2.revisionFirstPublishedOn
        ).toBe(true);
        expect(
            rev3AfterPublish3.revisionLastPublishedOn > rev2AfterPublish2.revisionLastPublishedOn
        ).toBe(true);
        expect(rev3AfterPublish3.firstPublishedOn).toBe(rev2AfterPublish2.firstPublishedOn);
        expect(rev3AfterPublish3.lastPublishedOn > rev2AfterPublish2.lastPublishedOn).toBe(true);

        expect(entriesListAfterPublish3[0]).toMatchObject({
            revisionFirstPublishedOn: expect.toBeDateString(),
            revisionLastPublishedOn: expect.toBeDateString(),
            revisionFirstPublishedBy: identityB,
            revisionLastPublishedBy: identityB,
            firstPublishedOn: expect.toBeDateString(),
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityB,
            lastPublishedBy: identityB
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
            revisionFirstPublishedOn: revAfterPublish1.revisionFirstPublishedOn,
            revisionLastPublishedOn: expect.toBeDateString(),
            revisionFirstPublishedBy: identityA,
            revisionLastPublishedBy: identityB,
            firstPublishedOn: revAfterPublish1.firstPublishedOn,
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityA,
            lastPublishedBy: identityB
        };

        expect(revAfterPublish2).toMatchObject(matchObject);

        expect(
            revAfterPublish2.revisionLastPublishedOn > revAfterPublish1.revisionLastPublishedOn
        ).toBe(true);
        expect(revAfterPublish2.lastPublishedOn > revAfterPublish1.lastPublishedOn).toBe(true);

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
            revisionFirstPublishedOn: rev1AfterPublish1.revisionFirstPublishedOn,
            revisionLastPublishedOn: expect.toBeDateString(),
            revisionFirstPublishedBy: identityA,
            revisionLastPublishedBy: identityB,
            firstPublishedOn: rev1AfterPublish1.firstPublishedOn,
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityA,
            lastPublishedBy: identityB
        });

        const matchObject = {
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            firstPublishedOn: rev1AfterPublish2.firstPublishedOn,
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityA,
            lastPublishedBy: identityB
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
            revisionFirstPublishedOn: revAfterPublish.revisionFirstPublishedOn,
            revisionLastPublishedOn: expect.toBeDateString(),
            revisionFirstPublishedBy: identityA,
            revisionLastPublishedBy: identityB,
            firstPublishedOn: revAfterPublish.firstPublishedOn,
            lastPublishedOn: expect.toBeDateString(),
            firstPublishedBy: identityA,
            lastPublishedBy: identityB
        };

        expect(revAfterRepublish).toMatchObject(matchObject);
        expect(entriesListAfterRepublish[0]).toMatchObject(matchObject);

        expect(
            revAfterRepublish.revisionLastPublishedOn > revAfterPublish.revisionLastPublishedOn
        ).toBe(true);
        expect(revAfterRepublish.lastPublishedOn > revAfterPublish.lastPublishedOn).toBe(true);

        expect(
            entriesListAfterRepublish[0].revisionLastPublishedOn >
                revAfterPublish.revisionLastPublishedOn
        ).toBe(true);
        expect(entriesListAfterRepublish[0].lastPublishedOn > revAfterPublish.lastPublishedOn).toBe(
            true
        );
    });
});
