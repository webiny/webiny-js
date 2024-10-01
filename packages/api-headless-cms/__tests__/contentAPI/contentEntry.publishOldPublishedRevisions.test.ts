import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { identityA } from "./security/utils";

describe("Content entries - Entry Publishing", () => {
    const { manage, read } = useTestModelHandler({
        identity: identityA
    });

    beforeEach(async () => {
        await manage.setup();
    });

    test("should be able to publish a previously published revision (entry already has the latest revision published)", async () => {
        const { data: revision1 } = await manage.createTestEntry({ data: { title: "Revision 1" } });

        await manage.publishTestEntry({
            revision: revision1.id
        });

        const { data: revision2 } = await manage.createTestEntryFrom({
            revision: revision1.id,
            data: { title: "Revision 2" }
        });

        await manage.publishTestEntry({
            revision: revision2.id
        });

        // Let's publish revision 1 again.
        await manage.publishTestEntry({
            revision: revision1.id
        });

        const { data: manageEntriesList } = await manage.listTestEntries();
        const { data: readEntriesList } = await read.listTestEntries();

        expect(manageEntriesList).toHaveLength(1);
        expect(manageEntriesList).toMatchObject([
            { id: revision2.id, title: "Revision 2", meta: { status: "unpublished" } }
        ]);

        expect(readEntriesList).toHaveLength(1);
        expect(readEntriesList).toMatchObject([{ id: revision1.id, title: "Revision 1" }]);
    });

    test("should be able to publish a previously published revision (entry already has a non-latest revision published)", async () => {
        const { data: revision1 } = await manage.createTestEntry({
            data: { title: "Revision 1" }
        });

        const { data: revision2 } = await manage.createTestEntryFrom({
            revision: revision1.id,
            data: { title: "Revision 2" }
        });

        // Let's publish revision 2.
        await manage.publishTestEntry({
            revision: revision2.id
        });

        const { data: revision3 } = await manage.createTestEntryFrom({
            revision: revision2.id,
            data: { title: "Revision 3" }
        });

        // Let's publish revision 3.
        await manage.publishTestEntry({
            revision: revision3.id
        });

        const { data: revision4 } = await manage.createTestEntryFrom({
            revision: revision3.id,
            data: { title: "Revision 4" }
        });

        {
            const { data: manageEntriesList } = await manage.listTestEntries();
            const { data: readEntriesList } = await read.listTestEntries();

            expect(manageEntriesList).toHaveLength(1);
            expect(manageEntriesList).toMatchObject([
                {
                    id: revision4.id,
                    title: "Revision 4",
                    meta: {
                        status: "draft",
                        revisions: [
                            {
                                title: "Revision 4",
                                slug: revision1.slug,
                                meta: { status: "draft", version: 4 }
                            },
                            {
                                title: "Revision 3",
                                slug: revision1.slug,
                                meta: { status: "published", version: 3 }
                            },
                            {
                                title: "Revision 2",
                                slug: revision1.slug,
                                meta: { status: "unpublished", version: 2 }
                            },
                            {
                                title: "Revision 1",
                                slug: revision1.slug,
                                meta: { status: "draft", version: 1 }
                            }
                        ]
                    }
                }
            ]);

            expect(readEntriesList).toHaveLength(1);
            expect(readEntriesList).toMatchObject([{ id: revision3.id, title: "Revision 3" }]);
        }

        // Let's publish older revision 2 .
        await manage.publishTestEntry({
            revision: revision2.id
        });

        {
            const { data: manageEntriesList } = await manage.listTestEntries();
            const { data: readEntriesList } = await read.listTestEntries();

            expect(manageEntriesList).toHaveLength(1);
            expect(manageEntriesList).toMatchObject([
                {
                    id: revision4.id,
                    title: "Revision 4",
                    meta: {
                        status: "draft",
                        revisions: [
                            {
                                title: "Revision 4",
                                slug: revision1.slug,
                                meta: { status: "draft", version: 4 }
                            },
                            {
                                title: "Revision 3",
                                slug: revision1.slug,
                                meta: { status: "unpublished", version: 3 }
                            },
                            {
                                title: "Revision 2",
                                slug: revision1.slug,
                                meta: { status: "published", version: 2 }
                            },
                            {
                                title: "Revision 1",
                                slug: revision1.slug,
                                meta: { status: "draft", version: 1 }
                            }
                        ]
                    }
                }
            ]);

            expect(readEntriesList).toHaveLength(1);
            expect(readEntriesList).toMatchObject([{ id: revision2.id, title: "Revision 2" }]);
        }
    });

    test("should be able to publish a previously published revision (entry already has a non-latest revision published, using `createFrom` mutations to publish in this test)", async () => {
        const { data: revision1 } = await manage.createTestEntry({
            data: { title: "Revision 1" }
        });

        const { data: revision2 } = await manage.createTestEntryFrom({
            revision: revision1.id,
            data: { title: "Revision 2", status: "published" }
        });

        const { data: revision3 } = await manage.createTestEntryFrom({
            revision: revision2.id,
            data: { title: "Revision 3", status: "published" }
        });

        const { data: revision4 } = await manage.createTestEntryFrom({
            revision: revision3.id,
            data: { title: "Revision 4" }
        });

        {
            const { data: manageEntriesList } = await manage.listTestEntries();
            const { data: readEntriesList } = await read.listTestEntries();

            expect(manageEntriesList).toHaveLength(1);
            expect(manageEntriesList).toMatchObject([
                {
                    id: revision4.id,
                    title: "Revision 4",
                    meta: {
                        status: "draft",
                        revisions: [
                            {
                                title: "Revision 4",
                                slug: revision1.slug,
                                meta: { status: "draft", version: 4 }
                            },
                            {
                                title: "Revision 3",
                                slug: revision1.slug,
                                meta: { status: "published", version: 3 }
                            },
                            {
                                title: "Revision 2",
                                slug: revision1.slug,
                                meta: { status: "unpublished", version: 2 }
                            },
                            {
                                title: "Revision 1",
                                slug: revision1.slug,
                                meta: { status: "draft", version: 1 }
                            }
                        ]
                    }
                }
            ]);

            expect(readEntriesList).toHaveLength(1);
            expect(readEntriesList).toMatchObject([{ id: revision3.id, title: "Revision 3" }]);
        }

        // Let's publish older revision 2.
        await manage.publishTestEntry({
            revision: revision2.id
        });

        {
            const { data: manageEntriesList } = await manage.listTestEntries();
            const { data: readEntriesList } = await read.listTestEntries();

            expect(manageEntriesList).toHaveLength(1);
            expect(manageEntriesList).toMatchObject([
                {
                    id: revision4.id,
                    title: "Revision 4",
                    meta: {
                        status: "draft",
                        revisions: [
                            {
                                title: "Revision 4",
                                slug: revision1.slug,
                                meta: { status: "draft", version: 4 }
                            },
                            {
                                title: "Revision 3",
                                slug: revision1.slug,
                                meta: { status: "unpublished", version: 3 }
                            },
                            {
                                title: "Revision 2",
                                slug: revision1.slug,
                                meta: { status: "published", version: 2 }
                            },
                            {
                                title: "Revision 1",
                                slug: revision1.slug,
                                meta: { status: "draft", version: 1 }
                            }
                        ]
                    }
                }
            ]);

            expect(readEntriesList).toHaveLength(1);
            expect(readEntriesList).toMatchObject([{ id: revision2.id, title: "Revision 2" }]);
        }
    });
});
