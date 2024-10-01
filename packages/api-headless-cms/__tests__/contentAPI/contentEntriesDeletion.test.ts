import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { identityA } from "./security/utils";

describe("Content entries - Entry Deletion", () => {
    const { manage, read } = useTestModelHandler({
        identity: identityA
    });

    beforeEach(async () => {
        await manage.setup();
    });

    test("MANAGE/READ GraphQL APIs should reflect revision deletions correctly", async () => {
        const { data: revision1 } = await manage.createTestEntry({ data: { title: "Revision 1" } });

        const { data: revision2 } = await manage.createTestEntryFrom({
            revision: revision1.id,
            data: { title: "Revision 2" }
        });

        const { data: revision3 } = await manage.createTestEntryFrom({
            revision: revision2.id,
            data: { title: "Revision 3" }
        });

        await manage.publishTestEntry({
            revision: revision3.id
        });

        let { data: manageEntriesList } = await manage.listTestEntries();
        let { data: readEntriesList } = await read.listTestEntries();

        expect(manageEntriesList).toHaveLength(1);
        expect(manageEntriesList).toMatchObject([
            { id: revision3.id, title: "Revision 3", meta: { status: "published" } }
        ]);

        expect(readEntriesList).toHaveLength(1);
        expect(readEntriesList).toMatchObject([{ id: revision3.id, title: "Revision 3" }]);

        await manage.deleteTestEntry({ revision: revision3.id });

        ({ data: manageEntriesList } = await manage.listTestEntries());
        ({ data: readEntriesList } = await read.listTestEntries());

        expect(manageEntriesList).toHaveLength(1);
        expect(manageEntriesList).toMatchObject([
            { id: revision2.id, title: "Revision 2", meta: { status: "draft" } }
        ]);

        expect(readEntriesList).toHaveLength(0);

        await manage.deleteTestEntry({ revision: revision2.id });

        ({ data: manageEntriesList } = await manage.listTestEntries());
        ({ data: readEntriesList } = await read.listTestEntries());

        expect(manageEntriesList).toHaveLength(1);
        expect(manageEntriesList).toMatchObject([
            { id: revision1.id, title: "Revision 1", meta: { status: "draft" } }
        ]);

        expect(readEntriesList).toHaveLength(0);

        await manage.deleteTestEntry({ revision: revision1.id });

        ({ data: manageEntriesList } = await manage.listTestEntries());
        ({ data: readEntriesList } = await read.listTestEntries());

        expect(manageEntriesList).toHaveLength(0);
        expect(readEntriesList).toHaveLength(0);
    });
});
