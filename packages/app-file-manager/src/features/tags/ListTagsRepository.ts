import { makeAutoObservable, runInAction } from "mobx";
import type { FmTag } from "../shared/types.js";
import {
    ListTagsRepository as RepositoryAbstraction,
    ListTagsGateway,
    type ListTagsGatewayParams,
    type ListTagsGatewayResult
} from "./abstractions.js";

class ListTagsRepositoryImpl implements RepositoryAbstraction.Interface {
    tags: FmTag[] = [];

    constructor(private gateway: ListTagsGateway.Interface) {
        makeAutoObservable(this);
    }

    async execute(params: ListTagsGatewayParams): Promise<ListTagsGatewayResult> {
        const result = await this.gateway.execute(params);

        runInAction(() => {
            this.tags = result;
        });

        return result;
    }
}

export const ListTagsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListTagsRepositoryImpl,
    dependencies: [ListTagsGateway]
});
