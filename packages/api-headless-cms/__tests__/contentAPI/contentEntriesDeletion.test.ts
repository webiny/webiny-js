import { beforeEach, describe, expect, it } from "vitest";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { identityA } from "./security/utils";

describe("Content entries - Entry Deletion", () => {
    const { manage, read } = useTestModelHandler({
        identity: identityA
    });

    beforeEach(async () => {
        await manage.setup();
    });

    it("MANAGE/READ GraphQL APIs should reflect revision deletions correctly", async () => {
        const { data: revision1 } = await manage.createTestEntry({
            variables: {
                data: {
                    values: {
                        title: "Revision 1"
                    }
                }
            }
        });

        const { data: revision2 } = await manage.createTestEntryFrom({
            variables: {
                revision: revision1.id,
                data: {
                    values: {
                        title: "Revision 2"
                    }
                }
            }
        });

        const { data: revision3 } = await manage.createTestEntryFrom({
            variables: {
                revision: revision2.id,
                data: {
                    values: {
                        title: "Revision 3"
                    }
                }
            }
        });

        await manage.publishTestEntry({
            variables: {
                revision: revision3.id
            }
        });

        let { data: manageEntriesList } = await manage.listTestEntries();
        let { data: readEntriesList } = await read.listTestEntries();

        expect(manageEntriesList).toHaveLength(1);
        expect(manageEntriesList).toMatchObject([
            {
                id: revision3.id,
                values: {
                    title: "Revision 3"
                },
                meta: { status: "published" }
            }
        ]);

        expect(readEntriesList).toHaveLength(1);
        expect(readEntriesList).toMatchObject([
            {
                id: revision3.id,
                values: {
                    title: "Revision 3"
                }
            }
        ]);

        await manage.deleteTestEntry({
            variables: {
                revision: revision3.id
            }
        });

        ({ data: manageEntriesList } = await manage.listTestEntries());
        ({ data: readEntriesList } = await read.listTestEntries());

        expect(manageEntriesList).toHaveLength(1);
        expect(manageEntriesList).toMatchObject([
            {
                id: revision2.id,
                values: {
                    title: "Revision 2"
                },
                meta: { status: "draft" }
            }
        ]);

        expect(readEntriesList).toHaveLength(0);

        await manage.deleteTestEntry({
            variables: {
                revision: revision2.id
            }
        });

        ({ data: manageEntriesList } = await manage.listTestEntries());
        ({ data: readEntriesList } = await read.listTestEntries());

        expect(manageEntriesList).toHaveLength(1);
        expect(manageEntriesList).toMatchObject([
            {
                id: revision1.id,
                values: {
                    title: "Revision 1"
                },
                meta: { status: "draft" }
            }
        ]);

        expect(readEntriesList).toHaveLength(0);

        await manage.deleteTestEntry({
            variables: {
                revision: revision1.id
            }
        });

        ({ data: manageEntriesList } = await manage.listTestEntries());
        ({ data: readEntriesList } = await read.listTestEntries());

        expect(manageEntriesList).toHaveLength(0);
        expect(readEntriesList).toHaveLength(0);
    });
});
