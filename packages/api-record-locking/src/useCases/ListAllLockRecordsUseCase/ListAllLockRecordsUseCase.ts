import {
    IListAllLockRecordsUseCase,
    IListAllLockRecordsUseCaseExecuteParams,
    IListAllLockRecordsUseCaseExecuteResponse
} from "~/abstractions/IListAllLockRecordsUseCase";
import { IRecordLockingModelManager } from "~/types";
import { convertEntryToLockRecord } from "~/utils/convertEntryToLockRecord";
import { convertWhereCondition } from "~/utils/convertWhereCondition";

export interface IListAllLockRecordsUseCaseParams {
    getManager(): Promise<IRecordLockingModelManager>;
}

export class ListAllLockRecordsUseCase implements IListAllLockRecordsUseCase {
    private readonly getManager: () => Promise<IRecordLockingModelManager>;
    public constructor(params: IListAllLockRecordsUseCaseParams) {
        this.getManager = params.getManager;
    }
    public async execute(
        input: IListAllLockRecordsUseCaseExecuteParams
    ): Promise<IListAllLockRecordsUseCaseExecuteResponse> {
        try {
            const manager = await this.getManager();
            const params: IListAllLockRecordsUseCaseExecuteParams = {
                ...input,
                where: convertWhereCondition(input.where)
            };

            const [items, meta] = await manager.listLatest(params);
            return {
                items: items.map(convertEntryToLockRecord),
                meta
            };
        } catch (ex) {
            throw ex;
        }
    }
}
