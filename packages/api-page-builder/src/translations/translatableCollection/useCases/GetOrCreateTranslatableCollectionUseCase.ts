import { PbContext } from "~/types";
import { TranslatableCollection } from "~/translations/translatableCollection/domain/TranslatableCollection";
import { GetTranslatableCollectionUseCase } from "~/translations/translatableCollection/useCases/GetTranslatableCollectionUseCase";

export class GetOrCreateTranslatableCollectionUseCase {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(collectionId: string): Promise<TranslatableCollection> {
        const getById = new GetTranslatableCollectionUseCase(this.context);
        const collection = await getById.execute(collectionId);

        if (!collection) {
            return new TranslatableCollection({ collectionId });
        }

        return collection;
    }
}
