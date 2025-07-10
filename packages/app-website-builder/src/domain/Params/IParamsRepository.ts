export interface ParamsRepositoryGetVariables {
    where: Record<string, any>;
}

export interface ParamsRepositorySetParams {
    where?: Record<string, any>;
}

export interface IParamsRepository {
    get: () => ParamsRepositoryGetVariables;
    set: (params: ParamsRepositorySetParams) => Promise<void>;
}
