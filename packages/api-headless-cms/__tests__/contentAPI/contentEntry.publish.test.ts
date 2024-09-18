import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { identityA } from "./security/utils";

describe("Content entries - Entry Deletion", () => {
    const { manage, read } = useTestModelHandler({
        identity: identityA
    });

    beforeEach(async () => {
        await manage.setup();
    });

    test("should be able to publish a previously published revision", async () => {
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
});
