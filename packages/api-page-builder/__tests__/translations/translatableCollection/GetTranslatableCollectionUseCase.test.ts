import { useHandler } from "~tests/translations/useHandler";
import { GetTranslatableCollectionUseCase } from "~/translations";

describe("GetTranslatableCollectionUseCase", () => {
    it("should throw a NOT_FOUND error if a collection doesn't exist", async () => {
        const { handler } = useHandler();
        const context = await handler();

        const getTranslatableCollection = new GetTranslatableCollectionUseCase(context);
        const loader = () => getTranslatableCollection.execute("collection:1");

        await expect(loader).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
});
