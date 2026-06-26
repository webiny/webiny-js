import { createAbstraction } from "@webiny/feature/admin";

export type NuxtConfig = string;

// Presenter
export interface INuxtConfigVm {
    loading: boolean;
    config: NuxtConfig | undefined;
}

export interface INuxtConfigPresenter {
    vm: INuxtConfigVm;
    init(): void;
}

export const NuxtConfigPresenter = createAbstraction<INuxtConfigPresenter>("NuxtConfigPresenter");

export namespace NuxtConfigPresenter {
    export type Interface = INuxtConfigPresenter;
    export type ViewModel = INuxtConfigVm;
}

// Repository
export interface INuxtConfigRepository {
    getConfig(): NuxtConfig | undefined;
    loadConfig(): Promise<void>;
}

export const NuxtConfigRepository =
    createAbstraction<INuxtConfigRepository>("NuxtConfigRepository");

export namespace NuxtConfigRepository {
    export type Interface = INuxtConfigRepository;
}

// Gateway
export interface INuxtConfigGateway {
    getConfig(): Promise<NuxtConfig>;
}

export const NuxtConfigGateway = createAbstraction<INuxtConfigGateway>("NuxtConfigGateway");

export namespace NuxtConfigGateway {
    export type Interface = INuxtConfigGateway;
    export type NuxtConfigDTO = string;
}
