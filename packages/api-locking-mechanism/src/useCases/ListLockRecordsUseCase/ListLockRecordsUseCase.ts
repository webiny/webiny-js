import {
    IListLockRecordsUseCase,
    IListLockRecordsUseCaseExecuteParams,
    IListLockRecordsUseCaseExecuteResponse
} from "~/abstractions/IListLockRecordsUseCase";
import { CmsIdentity } from "@webiny/api-headless-cms/types";

export interface IListLockRecordsUseCaseParams {
    listAllLockRecordsUseCase: IListLockRecordsUseCase;
    timeout: number;
    getIdentity(): CmsIdentity;
}

export class ListLockRecordsUseCase implements IListLockRecordsUseCase {
    private readonly listAllLockRecordsUseCase: IListLockRecordsUseCase;
    private readonly timeout: number;
    private readonly getIdentity: () => CmsIdentity;

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
