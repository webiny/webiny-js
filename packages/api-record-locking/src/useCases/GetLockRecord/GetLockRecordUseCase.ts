import type {
    IGetLockRecordUseCase,
    IGetLockRecordUseCaseExecuteParams
} from "~/abstractions/IGetLockRecordUseCase.js";
import type { IRecordLockingLockRecord, IRecordLockingModelManager } from "~/types.js";
import { NotFoundError } from "@webiny/handler-graphql";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId.js";
import { createIdentifier } from "@webiny/utils";
import type { ConvertEntryToLockRecordCb } from "~/useCases/types.js";
import type { Security } from "@webiny/api-core/types/security.js";

export interface IGetLockRecordUseCaseParams {
    getManager(): Promise<IRecordLockingModelManager>;
    getSecurity(): Pick<Security, "withoutAuthorization">;
    convert: ConvertEntryToLockRecordCb;
}

export class GetLockRecordUseCase implements IGetLockRecordUseCase {
    private readonly getManager: IGetLockRecordUseCaseParams["getManager"];
    private readonly getSecurity: IGetLockRecordUseCaseParams["getSecurity"];
    private readonly convert: ConvertEntryToLockRecordCb;

    public constructor(params: IGetLockRecordUseCaseParams) {
        this.getManager = params.getManager;
        this.getSecurity = params.getSecurity;
        this.convert = params.convert;
    }

    public async execute(
        input: IGetLockRecordUseCaseExecuteParams
    ): Promise<IRecordLockingLockRecord | null> {
        const recordId = createLockRecordDatabaseId(input.id);
        const id = createIdentifier({
            id: recordId,
            version: 1
        });
        const security = this.getSecurity();
        try {
            const manager = await this.getManager();
            return await security.withoutAuthorization(async () => {
                const result = await manager.get(id);
                return this.convert(result);
            });
        } catch (ex) {
            if (ex instanceof NotFoundError) {
                return null;
            }
            throw ex;
        }
    }
}
