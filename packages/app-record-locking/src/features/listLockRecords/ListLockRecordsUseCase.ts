import {
    ListLockRecordsUseCase as UseCaseAbstraction,
    ListLockRecordsGateway,
    type IListLockRecordsParams
} from "./abstractions.js";

class ListLockRecordsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: ListLockRecordsGateway.Interface) {}

    async execute(params: IListLockRecordsParams) {
        return this.gateway.execute(params);
    }
}

export const ListLockRecordsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListLockRecordsUseCaseImpl,
    dependencies: [ListLockRecordsGateway]
});
