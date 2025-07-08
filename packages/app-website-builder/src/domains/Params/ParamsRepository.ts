import { makeAutoObservable, toJS } from "mobx";
import type {
    IParamsRepository,
    ParamsRepositoryParams
} from "~/domains/Params/IParamsRepository.js";

export class ParamsRepository implements IParamsRepository {
    where: Record<string, any> = {};
    search: string | undefined = undefined;
    sort: string[] | undefined = undefined;
    after: string | undefined = undefined;
    limit: number = 50;

    constructor() {
        makeAutoObservable(this);
    }

    get() {
        return toJS(this);
    }

    setAll(params: ParamsRepositoryParams) {
        if (params.where !== undefined) {
            this.where = params.where;
        }
        if (params.sort !== undefined) {
            this.sort = params.sort;
        }
        if (params.limit !== undefined) {
            this.limit = params.limit;
        }
        if (params.after !== undefined) {
            this.after = params.after;
        }
        if (params.search !== undefined) {
            this.search = params.search;
        }
    }
}
