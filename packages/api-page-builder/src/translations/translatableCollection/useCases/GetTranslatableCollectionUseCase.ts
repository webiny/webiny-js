import { PbContext } from "~/types";
import type { TranslatableCollection } from "~/translations/translatableCollection/domain/TranslatableCollection";
import { GetTranslatableCollectionByIdRepository } from "~/translations/translatableCollection/repository/GetTranslatableCollectionByIdRepository";

export class GetTranslatableCollectionUseCase {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(collectionId: string): Promise<TranslatableCollection | undefined> {
        try {
            const getById = new GetTranslatableCollectionByIdRepository(this.context);
            return await getById.execute(collectionId);
        } catch {
            return undefined;
        }
    }
}
