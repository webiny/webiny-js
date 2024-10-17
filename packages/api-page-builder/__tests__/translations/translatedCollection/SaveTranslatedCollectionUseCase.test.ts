import { useHandler } from "~tests/translations/useHandler";
import {
    SaveTranslatableCollectionUseCase,
    SaveTranslatableCollectionParams,
    SaveTranslatedCollectionUseCase
} from "~/translations";
import { PbContext } from "~/graphql/types";
import { TranslatedItem } from "~/translations/translatedCollection/domain/TranslatedItem";

const createTranslatableCollection = async (
    context: PbContext,
    params: SaveTranslatableCollectionParams
) => {
    const saveCollection = new SaveTranslatableCollectionUseCase(context);
    await saveCollection.execute(params);
};

const translatedItemsToDto = (items: TranslatedItem[]) => {
    return items.map(item => {
        return {
            itemId: item.itemId,
            value: item.value,
            translatedOn: item.translatedOn
        };
    });
};

describe("SaveTranslatedCollectionUseCase", () => {
    it("should save translations", async () => {
        const { handler } = useHandler();
        const context = await handler();

        // Setup
        await createTranslatableCollection(context, {
            collectionId: "collection:1",
            items: [
                { itemId: "element:1", value: "Value 1" },
                { itemId: "element:2", value: "Value 2" },
                { itemId: "element:3", value: "Value 3" }
            ]
        });

        // Test 1
        const saveTranslatedCollection = new SaveTranslatedCollectionUseCase(context);
        const newCollection = await saveTranslatedCollection.execute({
            collectionId: "collection:1",
            languageCode: "en",
            items: [
                { itemId: "element:1", value: "Translated Value 1" },
                { itemId: "element:2", value: "Translated Value 2" }
            ]
        });

        const translatedItemsDto = translatedItemsToDto(newCollection.getItems());

        expect(translatedItemsDto).toEqual([
            { itemId: "element:1", value: "Translated Value 1", translatedOn: expect.any(Date) },
            { itemId: "element:2", value: "Translated Value 2", translatedOn: expect.any(Date) },
            { itemId: "element:3", value: undefined, translatedOn: undefined }
        ]);

        // Test 2
        const updatedCollection = await saveTranslatedCollection.execute({
            collectionId: "collection:1",
            languageCode: "en",
            items: [{ itemId: "element:3", value: "Translated Value 3" }]
        });

        const updatedItemsDto = translatedItemsToDto(updatedCollection.getItems());
        expect(updatedItemsDto).toEqual([
            {
                itemId: "element:1",
                value: "Translated Value 1",
                translatedOn: translatedItemsDto[0].translatedOn
            },
            {
                itemId: "element:2",
                value: "Translated Value 2",
                translatedOn: translatedItemsDto[1].translatedOn
            },
            { itemId: "element:3", value: "Translated Value 3", translatedOn: expect.any(Date) }
        ]);
    });
});
