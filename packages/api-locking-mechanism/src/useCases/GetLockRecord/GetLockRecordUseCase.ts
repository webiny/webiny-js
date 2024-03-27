import {
    IGetLockRecordUseCase,
    IGetLockRecordUseCaseExecuteParams
} from "~/abstractions/IGetLockRecordUseCase";
import { ILockingMechanismModelManager, ILockingMechanismLockRecord } from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { convertEntryToLockRecord } from "~/utils/convertEntryToLockRecord";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId";
import { createIdentifier } from "@webiny/utils";

export interface IGetLockRecordUseCaseParams {
    getManager(): Promise<ILockingMechanismModelManager>;
}

export class GetLockRecordUseCase implements IGetLockRecordUseCase {
    private readonly getManager: IGetLockRecordUseCaseParams["getManager"];

    public constructor(params: IGetLockRecordUseCaseParams) {
        this.getManager = params.getManager;
    }

    public async execute(
        input: IGetLockRecordUseCaseExecuteParams
    ): Promise<ILockingMechanismLockRecord | null> {
        const inputId = typeof input === "string" ? input : input.id;
        const recordId = createLockRecordDatabaseId(inputId);
        const id = createIdentifier({
            id: recordId,
            version: 1
        });
        try {
            const manager = await this.getManager();
            const result = await manager.get(id);
            return convertEntryToLockRecord(result);
        } catch (ex) {
            if (ex instanceof NotFoundError) {
                return null;
            }
            throw ex;
        }
    }
}
