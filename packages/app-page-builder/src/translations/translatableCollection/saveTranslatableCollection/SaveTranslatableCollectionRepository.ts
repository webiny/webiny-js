import { makeAutoObservable } from "mobx";
import { ISaveTranslatableCollectionRepository } from "~/translations/translatableCollection/saveTranslatableCollection/ISaveTranslatableCollectionRepository";
import { ISaveTranslatableCollectionGateway } from "~/translations/translatableCollection/saveTranslatableCollection/ISaveTranslatableCollectionGateway";
import { TranslatableCollection } from "~/translations/translatableCollection/TranslatableCollection";
import { TranslatableCollectionInputDto } from "~/translations/translatableCollection/saveTranslatableCollection/TranslatableCollectionInputDto";
import { TranslatedCollection } from "~/translations";
import { ListCache } from "~/translations/ListCache";

export class SaveTranslatableCollectionRepository implements ISaveTranslatableCollectionRepository {
    private readonly gateway: ISaveTranslatableCollectionGateway;
    private translatedCollectionCache: ListCache<TranslatedCollection>;

    constructor(
        gateway: ISaveTranslatableCollectionGateway,
        translatedCollectionCache: ListCache<TranslatedCollection>
    ) {
        this.translatedCollectionCache = translatedCollectionCache;
        this.gateway = gateway;
        makeAutoObservable(this);
    }

    async execute(translatableCollection: TranslatableCollection) {
        const dto: TranslatableCollectionInputDto = {
            collectionId: translatableCollection.collectionId,
            items: translatableCollection.items.map(item => {
                return {
                    itemId: item.itemId,
                    value: item.value,
                    context: item.context
                };
            })
        };

        await this.gateway.execute(dto);

        // We want to flush the `translatedCollection` for the given collectionId to force loading of fresh data.
        // TODO: Ideally, this would be done via an event, but we don't yet have an event manager on the client side.
        this.translatedCollectionCache.removeItems(
            item => item.collectionId === translatableCollection.collectionId
        );
    }
}
