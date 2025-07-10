export interface ParamsRepositoryGetVariables {
    where: Record<string, any>;
    limit: number;
    sort?: string[];
    after?: string;
    search?: string;
}

export interface ParamsRepositorySetParams {
    where?: Record<string, any>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IParamsRepository {
    get: () => ParamsRepositoryGetVariables;
    setAll: (params: ParamsRepositorySetParams) => void;
}
