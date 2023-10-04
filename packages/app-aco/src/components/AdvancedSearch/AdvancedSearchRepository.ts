import { makeAutoObservable } from "mobx";
import { Mode, QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";

export class AdvancedSearchRepository {
    private filter: QueryObjectDTO | null = null;
    private mode: Mode = Mode.CREATE;

    constructor() {
        makeAutoObservable(this);
    }

    setFilter(filter: QueryObjectDTO | null) {
        this.filter = filter;
    }

    getFilter(): QueryObjectDTO | null {
        return this.filter;
    }

    setMode(mode: Mode) {
        this.mode = mode;
    }

    getMode(): Mode {
        return this.mode;
    }
}

export const advancedSearchRepository = new AdvancedSearchRepository();
