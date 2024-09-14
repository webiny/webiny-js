import { Loading } from "~/translations/Loading";
import { TranslatedCollection } from "~/translations/translatedCollection/TranslatedCollection";

export interface IGetTranslatedCollectionRepository {
    execute(collectionId: string, languageCode: string): Promise<TranslatedCollection | undefined>;
    getLoading(): Loading;
    getTranslatedCollection<TContext>(
        collectionId: string,
        languageCode: string
    ): TranslatedCollection<TContext> | undefined;
}
