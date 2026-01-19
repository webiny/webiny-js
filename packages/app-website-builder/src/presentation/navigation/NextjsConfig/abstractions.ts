import { createAbstraction } from "@webiny/feature/admin";

export type NextjsConfig = string;

// Presenter
export interface INextjsConfigVm {
    loading: boolean;
    config: NextjsConfig | undefined;
}

export interface INextjsConfigPresenter {
    vm: INextjsConfigVm;
    init(): void;
}

export const NextjsConfigPresenter =
    createAbstraction<INextjsConfigPresenter>("NextjsConfigPresenter");

export namespace NextjsConfigPresenter {
    export type Interface = INextjsConfigPresenter;
    export type ViewModel = INextjsConfigVm;
}

// Repository
export interface INextjsConfigRepository {
    getConfig(): NextjsConfig | undefined;
    loadConfig(): Promise<void>;
}

export const NextjsConfigRepository =
    createAbstraction<INextjsConfigRepository>("NextjsConfigRepository");

export namespace NextjsConfigRepository {
    export type Interface = INextjsConfigRepository;
}

// Gateway
export interface INextjsConfigGateway {
    getConfig(): Promise<NextjsConfig>;
}

export const NextjsConfigGateway = createAbstraction<INextjsConfigGateway>("NextjsConfigGateway");

export namespace NextjsConfigGateway {
    export type Interface = INextjsConfigGateway;
    export type NextjsConfigDTO = string;
}
