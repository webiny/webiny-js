import {
    IListLockRecordsUseCase,
    IListLockRecordsUseCaseExecuteParams,
    IListLockRecordsUseCaseExecuteResponse
} from "~/abstractions/IListLockRecordsUseCase";

export interface IListLockRecordsUseCaseParams {
    listAllLockRecordsUseCase: IListLockRecordsUseCase;
    timeout: number;
}

export class ListLockRecordsUseCase implements IListLockRecordsUseCase {
    private readonly listAllLockRecordsUseCase: IListLockRecordsUseCase;
    private readonly timeout: number;

    public constructor(params: IListLockRecordsUseCaseParams) {
        this.listAllLockRecordsUseCase = params.listAllLockRecordsUseCase;
        this.timeout = params.timeout;
    }
    public async execute(
        input: IListLockRecordsUseCaseExecuteParams
    ): Promise<IListLockRecordsUseCaseExecuteResponse> {
        return this.listAllLockRecordsUseCase.execute({
            ...input,
            where: {
                ...input.where,
                savedOn_gte: new Date(new Date().getTime() - this.timeout)
            }
        });
    }
}
