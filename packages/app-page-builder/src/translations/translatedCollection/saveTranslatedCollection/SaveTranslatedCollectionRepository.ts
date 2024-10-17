import { makeAutoObservable, runInAction } from "mobx";
import { ISaveTranslatedCollectionRepository } from "~/translations/translatedCollection/saveTranslatedCollection/ISaveTranslatedCollectionRepository";
import { ISaveTranslatedCollectionGateway } from "~/translations/translatedCollection/saveTranslatedCollection/ISaveTranslatedCollectionGateway";
import { TranslatedCollection } from "~/translations";
import { ListCache } from "~/translations/ListCache";
import { TranslatedCollectionInputDto } from "~/translations/translatedCollection/saveTranslatedCollection/TranslatedCollectionInputDto";

export class SaveTranslatedCollectionRepository implements ISaveTranslatedCollectionRepository {
    private readonly gateway: ISaveTranslatedCollectionGateway;
    private cache: ListCache<TranslatedCollection>;
    private loading = false;

    constructor(gateway: ISaveTranslatedCollectionGateway, cache: ListCache<TranslatedCollection>) {
        this.cache = cache;
        this.gateway = gateway;
        makeAutoObservable(this);
    }

    getLoading(): boolean {
        return this.loading;
    }

    async execute(translatedCollection: TranslatedCollection) {
        const dto: TranslatedCollectionInputDto = {
            collectionId: translatedCollection.collectionId,
            languageCode: translatedCollection.languageCode,
            items: translatedCollection.items.map(item => {
                return {
                    itemId: item.itemId,
                    value: item.value
                };
            })
        };

        this.loading = true;

        try {
            const updatedCollectionDto = await this.gateway.execute(dto);

            const newTranslatedCollection: TranslatedCollection = {
                collectionId: updatedCollectionDto.collectionId,
                languageCode: updatedCollectionDto.languageCode,
                items: updatedCollectionDto.items.map(item => ({
                    itemId: item.itemId,
                    baseValue: item.baseValue,
                    baseValueModifiedOn: new Date(item.baseValueModifiedOn),
                    value: item.value,
                    context: item.context,
                    translatedOn: item.translatedOn ? new Date(item.translatedOn) : undefined,
                    translatedBy: item.translatedBy
                }))
            };

            this.cache.updateItems(item => {
                if (
                    item.collectionId === translatedCollection.collectionId &&
                    item.languageCode === translatedCollection.languageCode
                ) {
                    return newTranslatedCollection;
                }
                return item;
            });
        } catch (err) {
            console.error(err);
        } finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }
}
