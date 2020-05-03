import mdbid from "mdbid";
import { createUtils } from "./utils";

describe("Copy Environment test", () => {
    const { useDatabase, useCopyHandler } = createUtils();
    const { invoke } = useCopyHandler();
    const { getCollection } = useDatabase();
    const sourceEnvironment = { id: mdbid() };
    const targetEnvironment = { id: mdbid() };

    beforeAll(async () => {
        await getCollection("CmsEnvironment").insertOne({
            id: sourceEnvironment.id,
            name: "Source Environment",
            description: "This is the source environment.",
            createdFrom: null
        });

        await getCollection("CmsEnvironment").insertOne({
            id: targetEnvironment.id,
            name: "Target Environment",
            description: "This is the target environment.",
            createdFrom: null
        });

        // await createContentModels({ environment: sourceEnvironment.id });
    });

    it("should contain 2 environments", async () => {
        const environments = await getCollection("CmsEnvironment").countDocuments();

        expect(environments).toBe(2);
    });

    // it("should copy data to target environment", async () => {
    //     await invoke({
    //         copyFrom: sourceEnvironment.id,
    //         copyTo: targetEnvironment.id
    //     });
    //
    //     const envModels = await getCollection("CmsContentModel").countDocuments({
    //         environment: targetEnvironment.id
    //     });
    //
    //     expect(envModels).toBe(1);
    // });
});
