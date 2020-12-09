import { ContentModelManager } from "@webiny/api-headless-cms/content/crud/ContentModelManager";

type DummyModelType = {
    id: string;
    name: string;
    createdOn: Date;
    changedOn?: Date | null;
};
type DummyModelUpdateType = {
    name?: string;
};

describe("ContentModelManager", () => {
    const context: any = {};
    let manager: ContentModelManager<DummyModelType>;
    beforeEach(async () => {
        const model = {} as any;
        manager = new ContentModelManager<DummyModelType>(context, model);
    });

    it("should get content model target by id", async () => {
        const model = await manager.get("1234");

        expect(model).toMatchObject({
            id: /^([a-zA-Z0-9]+)$/,
            name: "model",
            createdOn: /^20/,
            changedOn: null
        });
    });

    it("should list content model target", async () => {
        const models = await manager.list();

        expect(models).toHaveLength(1);
        expect(models[0]).toEqual({
            id: /^([a-zA-Z0-9]+)$/,
            name: "model",
            createdOn: /^20/,
            changedOn: null
        });
    });

    it("should update content model target", async () => {
        const model = await manager.get("1234");

        const updatedModel = await manager.update<DummyModelUpdateType>({
            name: "modelUpdated"
        });

        expect(updatedModel).toEqual({
            ...model,
            name: "modelUpdated",
            changedOn: /^20/
        });

        const modelAfterUpdate = await manager.get("1234");
        expect(modelAfterUpdate).toEqual(updatedModel);
    });

    it("should delete content model target", async () => {
        const model = await manager.get("1234");

        const response = await manager.delete(model.id);
        expect(response).toEqual(true);

        const modelAfterDelete = await manager.get("1234");
        expect(modelAfterDelete).toBeNull();
    });
});
