import { useHandler } from "~tests/translations/useHandler";
import { SaveTranslatableCollectionUseCase } from "~/translations";
import { defaultIdentity } from "~tests/tenancySecurity";
import { Identity } from "~/translations/Identity";

const anotherIdentity: Identity = {
    id: "87654321",
    type: "admin",
    displayName: "Jane Doe"
};

describe("SaveTranslatableCollectionUseCase", () => {
    it("should save a collection (create a new one, or update an existing one)", async () => {
        const { handler } = useHandler();
        const context = await handler();

        const saveTranslatableCollection = new SaveTranslatableCollectionUseCase(context);
        const newCollection = await saveTranslatableCollection.execute({
            collectionId: "collection:1",
            items: [
                { itemId: "element:1", value: "Value 1" },
                { itemId: "element:2", value: "Value 2" }
            ]
        });

        expect(newCollection.getCollectionId()).toEqual("collection:1");

        const newItemsDto = newCollection.getItems().map(item => {
            return {
                itemId: item.itemId,
                value: item.value,
                modifiedOn: item.modifiedOn,
                modifiedBy: item.modifiedBy
            };
        });

        expect(newItemsDto).toEqual([
            {
                itemId: "element:1",
                value: "Value 1",
                modifiedOn: expect.any(Date),
                modifiedBy: defaultIdentity
            },
            {
                itemId: "element:2",
                value: "Value 2",
                modifiedOn: expect.any(Date),
                modifiedBy: defaultIdentity
            }
        ]);

        // Pivot
        context.security.setIdentity(anotherIdentity);

        const updatedCollection = await saveTranslatableCollection.execute({
            collectionId: "collection:1",
            items: [
                // If we pass the same `itemId` and `value`, the `modifiedOn` timestamp must not change!
                { itemId: "element:1", value: "Value 1" },
                { itemId: "element:2", value: "Value 2" },
                { itemId: "element:3", value: "Value 3" }
            ]
        });

        const updatedItemsDto = updatedCollection.getItems().map(item => {
            return {
                itemId: item.itemId,
                value: item.value,
                modifiedOn: item.modifiedOn,
                modifiedBy: item.modifiedBy
            };
        });

        expect(updatedItemsDto).toEqual([
            ...newItemsDto,
            {
                itemId: "element:3",
                value: "Value 3",
                modifiedOn: expect.any(Date),
                modifiedBy: anotherIdentity
            }
        ]);
    });
});
