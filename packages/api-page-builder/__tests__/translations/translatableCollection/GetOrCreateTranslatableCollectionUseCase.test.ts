import { useHandler } from "~tests/translations/useHandler";
import { GetOrCreateTranslatableCollectionUseCase } from "~/translations";

describe("GetOrCreateTranslatableCollectionUseCase", () => {
    it("should return a new TranslatableCollection object, if a collection doesn't exist", async () => {
        const { handler } = useHandler();
        const context = await handler();

        const getTranslatableCollection = new GetOrCreateTranslatableCollectionUseCase(context);
        const collection = await getTranslatableCollection.execute("collection:1");

        expect(collection.getCollectionId()).toEqual("collection:1");
        expect(collection.getItems()).toEqual([]);
        expect(collection.getId()).toBeUndefined();
    });
});
