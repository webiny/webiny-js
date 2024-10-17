import { Loading } from "~/translations/Loading";
import { TranslatedCollection } from "~/translations/translatedCollection/TranslatedCollection";
import { GenericRecord } from "@webiny/app/types";

export interface IGetTranslatedCollectionRepository {
    execute(collectionId: string, languageCode: string): Promise<TranslatedCollection | undefined>;
    getLoading(): Loading;
    getTranslatedCollection<TContext extends GenericRecord<string> = GenericRecord<string>>(
        collectionId: string,
        languageCode: string
    ): TranslatedCollection<TContext> | undefined;
}
