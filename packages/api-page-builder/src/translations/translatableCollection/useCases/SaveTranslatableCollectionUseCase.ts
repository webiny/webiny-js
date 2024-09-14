import { PbContext } from "~/graphql/types";
import { UpdateTranslatableCollectionRepository } from "~/translations/translatableCollection/repository/UpdateTranslatableCollectionRepository";
import { TranslatableCollection } from "~/translations/translatableCollection/domain/TranslatableCollection";
import { GetOrCreateTranslatableCollectionUseCase } from "~/translations/translatableCollection/useCases/GetOrCreateTranslatableCollectionUseCase";
import { CreateTranslatableCollectionRepository } from "~/translations/translatableCollection/repository/CreateTranslatableCollectionRepository";
import { Identifier } from "~/translations/Identifier";
import { TranslatableItem } from "~/translations/translatableCollection/domain/TranslatableItem";

export interface SaveTranslatableCollectionParams {
    collectionId: string;
    items: Array<{
        itemId: string;
        value: string;
        modifiedOn?: string;
        context?: Record<string, any>;
    }>;
}

export class SaveTranslatableCollectionUseCase {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(params: SaveTranslatableCollectionParams): Promise<TranslatableCollection> {
        const getOrCreate = new GetOrCreateTranslatableCollectionUseCase(this.context);
        const collection = await getOrCreate.execute(params.collectionId);

        const identity = this.getIdentity();

        const items = params.items.map(item => {
            return TranslatableItem.create({
                itemId: item.itemId,
                value: item.value,
                context: item.context,
                modifiedOn: item.modifiedOn ? new Date(item.modifiedOn) : new Date(),
                modifiedBy: identity
            });
        });

        collection.setItems(items);

        if (collection.getId()) {
            const update = new UpdateTranslatableCollectionRepository(this.context);
            await update.execute(collection);
        } else {
            collection.setId(Identifier.generate());
            const create = new CreateTranslatableCollectionRepository(this.context);
            await create.execute(collection);
        }

        return collection;
    }

    private getIdentity() {
        const identity = this.context.security.getIdentity();

        return {
            id: identity.id,
            type: identity.type,
            displayName: identity.displayName || ""
        };
    }
}
