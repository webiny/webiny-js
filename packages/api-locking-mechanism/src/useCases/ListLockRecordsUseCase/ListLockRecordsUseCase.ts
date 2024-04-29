import {
    IListLockRecordsUseCase,
    IListLockRecordsUseCaseExecuteParams,
    IListLockRecordsUseCaseExecuteResponse
} from "~/abstractions/IListLockRecordsUseCase";
import { IGetIdentity } from "~/types";

export interface IListLockRecordsUseCaseParams {
    listAllLockRecordsUseCase: IListLockRecordsUseCase;
    timeout: number;
    getIdentity: IGetIdentity;
}

export class ListLockRecordsUseCase implements IListLockRecordsUseCase {
    private readonly listAllLockRecordsUseCase: IListLockRecordsUseCase;
    private readonly timeout: number;
    private readonly getIdentity: IGetIdentity;

    public constructor(params: IListLockRecordsUseCaseParams) {
        this.listAllLockRecordsUseCase = params.listAllLockRecordsUseCase;
        this.timeout = params.timeout;
        this.getIdentity = params.getIdentity;
    }
    public async execute(
        input: IListLockRecordsUseCaseExecuteParams
    ): Promise<IListLockRecordsUseCaseExecuteResponse> {
        const identity = this.getIdentity();
        return this.listAllLockRecordsUseCase.execute({
            ...input,
            where: {
                ...input.where,
                createdBy_not: identity.id,
                savedOn_gte: new Date(new Date().getTime() - this.timeout)
            }
        });
    }
}
