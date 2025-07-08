export interface ParamsRepositoryParams {
    where?: Record<string, any>;
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IParamsRepository {
    get: () => Record<string, any>;
    setAll: (params: ParamsRepositoryParams) => void;
}
