import { makeAutoObservable, toJS, runInAction } from "mobx";
import type {
    IParamsRepository,
    ParamsRepositoryGetVariables,
    ParamsRepositorySetParams
} from "~/domain/Params/IParamsRepository.js";

export class ParamsRepository implements IParamsRepository {
    where: Record<string, any> = {};

    constructor() {
        makeAutoObservable(this);
    }

    get(): ParamsRepositoryGetVariables {
        return toJS({
            where: toJS(this.where)
        });
    }

    async set(params: ParamsRepositorySetParams) {
        runInAction(() => {
            if (params.where !== undefined) {
                this.where = params.where;
            }
        });
    }
}
