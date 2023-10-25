import { FilterRaw } from "~/components/AdvancedSearch/domain";
import { AcoError } from "~/types";

export interface ListFiltersQueryVariables {
    namespace: string;
    limit: number;
    sort?: Record<string, any>;
    after?: string | null;
}

export interface ListFiltersResponse {
    aco: {
        listFilters: {
            data: FilterRaw[] | null;
            error: AcoError | null;
        };
    };
}

export interface GetFilterResponse {
    aco: {
        getFilter: {
            data: FilterRaw | null;
            error: AcoError | null;
        };
    };
}

export interface GetFilterQueryVariables {
    id: string;
}

export interface CreateFilterPayload
    extends Omit<FilterRaw, "createdOn" | "createdBy" | "savedOn"> {
    namespace: string;
}

export interface CreateFilterVariables {
    data: CreateFilterPayload;
}

export interface CreateFilterResponse {
    aco: {
        createFilter: {
            data: FilterRaw;
            error: AcoError | null;
        };
    };
}

export type UpdateFilterPayload = Partial<Omit<FilterRaw, "createdOn" | "createdBy" | "savedOn">>;

export interface UpdateFilterVariables {
    id: string;
    data: Omit<UpdateFilterPayload, "id">;
}

export interface UpdateFilterResponse {
    aco: {
        updateFilter: {
            data: FilterRaw;
            error: AcoError | null;
        };
    };
}

export interface DeleteFilterVariables {
    id: string;
}

export interface DeleteFilterResponse {
    aco: {
        deleteFilter: {
            data: boolean;
            error: AcoError | null;
        };
    };
}
