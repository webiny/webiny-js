import {
    IListLockRecordsUseCase,
    IListLockRecordsUseCaseExecuteParams
} from "~/abstractions/IListLockRecordsUseCase";
import { ILockingMechanismListLockRecordsResponse, ILockingMechanismModelManager } from "~/types";
import { convertEntryToLockRecord } from "~/utils/convertEntryToLockRecord";
import { convertWhereCondition } from "~/utils/convertWhereCondition";

export interface IListLockRecordsUseCaseParams {
    getManager(): Promise<ILockingMechanismModelManager>;
}

export class ListLockRecordsUseCase implements IListLockRecordsUseCase {
    private readonly getManager: () => Promise<ILockingMechanismModelManager>;
    public constructor(params: IListLockRecordsUseCaseParams) {
        this.getManager = params.getManager;
    }
    public async execute(
        input: IListLockRecordsUseCaseExecuteParams
    ): Promise<ILockingMechanismListLockRecordsResponse> {
        try {
            const manager = await this.getManager();
            const params: IListLockRecordsUseCaseExecuteParams = {
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
