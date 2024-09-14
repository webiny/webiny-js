import { TranslatedCollectionInputDto } from "~/translations/translatedCollection/saveTranslatedCollection/TranslatedCollectionInputDto";
import { TranslatedCollectionDto } from "~/translations/translatedCollection/getTranslatedCollection/TranslatedCollectionDto";

export interface ISaveTranslatedCollectionGateway {
    execute(
        translatedCollectionDto: TranslatedCollectionInputDto
    ): Promise<TranslatedCollectionDto>;
}
