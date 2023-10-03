import { makeAutoObservable } from "mobx";
import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";

export class AdvancedSearchRepository {
    private filter: QueryObjectDTO | undefined = undefined;

    constructor() {
        makeAutoObservable(this);
    }

    setFilter(filter: QueryObjectDTO | undefined) {
        this.filter = filter;
    }

    getFilter(): QueryObjectDTO | undefined {
        return this.filter;
    }
}

export const advancedSearchRepository = new AdvancedSearchRepository();
