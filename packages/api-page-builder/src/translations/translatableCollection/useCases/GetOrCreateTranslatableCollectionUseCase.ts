import { PbContext } from "~/types";
import { TranslatableCollection } from "~/translations/translatableCollection/domain/TranslatableCollection";
import { GetTranslatableCollectionUseCase } from "~/translations/translatableCollection/useCases/GetTranslatableCollectionUseCase";

export class GetOrCreateTranslatableCollectionUseCase {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(collectionId: string): Promise<TranslatableCollection> {
        try {
            const getById = new GetTranslatableCollectionUseCase(this.context);
            return await getById.execute(collectionId);
        } catch (err) {
            if (err.code === "NOT_FOUND") {
                return new TranslatableCollection({ collectionId });
            }

            throw err;
        }
    }
}
