import { IGetLockRecordUseCase } from "~/lockingMechanism/abstractions/IGetLockRecordUseCase";
import { ICmsModelLockRecordManager, IHeadlessCmsLockRecord } from "~/lockingMechanism/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { convertEntryToLockRecord } from "~/lockingMechanism/utils/convertEntryToLockRecord";

export interface IGetLockRecordUseCaseParams {
    getManager(): Promise<ICmsModelLockRecordManager>;
}

export class GetLockRecordUseCase implements IGetLockRecordUseCase {
    private readonly getManager: IGetLockRecordUseCaseParams["getManager"];

    public constructor(params: IGetLockRecordUseCaseParams) {
        this.getManager = params.getManager;
    }

    public async execute(id: string): Promise<IHeadlessCmsLockRecord | null> {
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
