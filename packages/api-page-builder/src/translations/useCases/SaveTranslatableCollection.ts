import { PbContext } from "~/graphql/types";
import { GetOrCreateTranslatableCollection } from "~/translations/useCases/GetOrCreateTranslatableCollection";
import { TranslatableItemDTO } from "~/translations/types";
import { TranslatableItemMapper } from "~/translations/TranslatableCollection/repository/TranslatableItemMapper";
import { UpdateTranslatableCollectionRepository } from "~/translations/TranslatableCollection/repository/UpdateTranslatableCollectionRepository";
import { TranslatableCollection } from "~/translations/TranslatableCollection/TranslatableCollection";

export class SaveTranslatableCollection {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(
        collectionId: string,
        items: TranslatableItemDTO[]
    ): Promise<TranslatableCollection> {
        const getOrCreate = new GetOrCreateTranslatableCollection(this.context);
        const collection = await getOrCreate.execute(collectionId);

        const updatedCollection = collection.setItems(
            items.map(item => TranslatableItemMapper.fromDTO(item))
        );

        const update = new UpdateTranslatableCollectionRepository(this.context);
        await update.execute(collection);

        return updatedCollection;
    }
}
