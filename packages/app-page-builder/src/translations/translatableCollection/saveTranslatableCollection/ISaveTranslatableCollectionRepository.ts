import { TranslatableCollection } from "~/translations/translatableCollection/TranslatableCollection";

export interface ISaveTranslatableCollectionRepository {
    execute(translatableCollection: TranslatableCollection): Promise<void>;
}
