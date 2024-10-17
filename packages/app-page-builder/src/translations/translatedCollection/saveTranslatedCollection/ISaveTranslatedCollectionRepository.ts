import { TranslatedCollection } from "~/translations/translatedCollection/TranslatedCollection";

export interface ISaveTranslatedCollectionRepository {
    getLoading(): boolean;
    execute(translatedCollection: TranslatedCollection): Promise<void>;
}
