import { GetRevisionById } from "./GetRevisionById";
import { GetRevisionByIdNotDeleted } from "./GetRevisionByIdNotDeleted";
import { CmsEntryStorageOperations } from "~/types";

interface GetRevisionByIdUseCasesParams {
    operation: CmsEntryStorageOperations["getRevisionById"];
}

export const getRevisionByIdUseCases = (params: GetRevisionByIdUseCasesParams) => {
    const getRevisionById = new GetRevisionById(params.operation);
    const getRevisionByIdNotDeleted = new GetRevisionByIdNotDeleted(getRevisionById);

    return {
        getRevisionByIdUseCase: getRevisionByIdNotDeleted
    };
};
