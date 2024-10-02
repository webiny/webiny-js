import { TranslatableCollectionInputDto } from "~/translations/translatableCollection/saveTranslatableCollection/TranslatableCollectionInputDto";

export interface ISaveTranslatableCollectionGateway {
    execute(translatableCollectionDto: TranslatableCollectionInputDto): Promise<void>;
}
