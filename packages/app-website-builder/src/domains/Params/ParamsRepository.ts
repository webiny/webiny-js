import { makeAutoObservable, toJS, runInAction } from "mobx";
import type {
    IParamsRepository,
    ParamsRepositoryGetVariables,
    ParamsRepositorySetParams
} from "~/domains/Params/IParamsRepository.js";

export class ParamsRepository implements IParamsRepository {
    where: Record<string, any> = {};
    limit = 50;
    sort: string[] | undefined;
    after: string | undefined;
    search: string | undefined;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    get(): ParamsRepositoryGetVariables {
        return toJS({
            where: toJS(this.where),
            limit: this.limit,
            sort: this.sort,
            after: this.after,
            search: this.search
        });
    }

    setAll(params: ParamsRepositorySetParams) {
        runInAction(() => {
            if (params.where !== undefined) {
                this.where = params.where;
            }
            if (params.limit !== undefined) {
                this.limit = params.limit;
            }
            if (params.sort !== undefined) {
                this.sort = params.sort;
            }
            if (params.after !== undefined) {
                this.after = params.after;
            }
            if (params.search !== undefined) {
                this.search = params.search;
            }
        });
    }
}
