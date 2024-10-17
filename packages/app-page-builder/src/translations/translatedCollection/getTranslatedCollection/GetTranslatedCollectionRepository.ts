import { makeAutoObservable } from "mobx";
import { IGetTranslatedCollectionRepository } from "~/translations/translatedCollection/getTranslatedCollection/IGetTranslatedCollectionRepository";
import { TranslatedCollection } from "~/translations/translatedCollection/TranslatedCollection";
import { Loading } from "~/translations/Loading";
import { ListCache } from "~/translations/ListCache";
import { IGetTranslatedCollectionGateway } from "~/translations/translatedCollection/getTranslatedCollection/IGetTranslatedCollectionGateway";
import { GenericRecord } from "@webiny/app/types";

export class GetTranslatedCollectionRepository implements IGetTranslatedCollectionRepository {
    private readonly loading: Loading;
    private gateway: IGetTranslatedCollectionGateway;
    private cache: ListCache<TranslatedCollection>;
    private loader: Promise<TranslatedCollection | undefined> | undefined;

    constructor(gateway: IGetTranslatedCollectionGateway, cache: ListCache<TranslatedCollection>) {
        this.gateway = gateway;
        this.cache = cache;
        this.loading = new Loading();
        makeAutoObservable(this);
    }

    async execute(
        collectionId: string,
        languageCode: string
    ): Promise<TranslatedCollection | undefined> {
        const existingItem = this.cache.getItem(
            item => item.collectionId === collectionId && item.languageCode === languageCode
        );

        if (existingItem) {
            return existingItem;
        }

        if (this.loader) {
            return this.loader;
        }

        this.loader = (async () => {
            const translatedCollectionDto = await this.loading.runCallbackWithLoading(
                () => this.gateway.execute(collectionId, languageCode),
                "Loading translated collection"
            );

            const translatedCollection: TranslatedCollection = {
                collectionId: translatedCollectionDto.collectionId,
                languageCode: translatedCollectionDto.languageCode,
                items: translatedCollectionDto.items.map(item => ({
                    itemId: item.itemId,
                    baseValue: item.baseValue,
                    baseValueModifiedOn: new Date(item.baseValueModifiedOn),
                    value: item.value,
                    context: item.context,
                    translatedOn: item.translatedOn ? new Date(item.translatedOn) : undefined,
                    translatedBy: item.translatedBy
                }))
            };

            this.cache.addItems([translatedCollection]);

            this.loader = undefined;

            return translatedCollection;
        })();

        return this.loader;
    }

    getLoading(): Loading {
        return this.loading;
    }

    getTranslatedCollection<TContext extends GenericRecord<string> = GenericRecord<string>>(
        collectionId: string,
        languageCode: string
    ): TranslatedCollection<TContext> | undefined {
        const item = this.cache.getItem(
            item => item.collectionId === collectionId && item.languageCode === languageCode
        );

        return item ? (item as TranslatedCollection<TContext>) : undefined;
    }
}
