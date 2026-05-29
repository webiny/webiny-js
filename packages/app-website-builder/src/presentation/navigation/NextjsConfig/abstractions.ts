import { createAbstraction } from "@webiny/feature/admin";

export type NextjsConfig = string;

export type StarterKitFramework = "nextjs" | "nuxt";

export const STARTER_KIT_FRAMEWORKS: { value: StarterKitFramework; label: string }[] = [
    { value: "nextjs", label: "Next.js" },
    { value: "nuxt", label: "Nuxt" }
];

// Presenter
export interface INextjsConfigVm {
    loading: boolean;
    config: NextjsConfig | undefined;
    framework: StarterKitFramework;
}

export interface INextjsConfigPresenter {
    vm: INextjsConfigVm;
    init(): void;
    setFramework(framework: StarterKitFramework): void;
}

export const NextjsConfigPresenter =
    createAbstraction<INextjsConfigPresenter>("NextjsConfigPresenter");

export namespace NextjsConfigPresenter {
    export type Interface = INextjsConfigPresenter;
    export type ViewModel = INextjsConfigVm;
}

// Repository
export interface INextjsConfigRepository {
    getConfig(framework: StarterKitFramework): NextjsConfig | undefined;
    loadConfig(framework: StarterKitFramework): Promise<void>;
}

export const NextjsConfigRepository =
    createAbstraction<INextjsConfigRepository>("NextjsConfigRepository");

export namespace NextjsConfigRepository {
    export type Interface = INextjsConfigRepository;
}

// Gateway
export interface INextjsConfigGateway {
    getConfig(framework: StarterKitFramework): Promise<NextjsConfig>;
}

export const NextjsConfigGateway = createAbstraction<INextjsConfigGateway>("NextjsConfigGateway");

export namespace NextjsConfigGateway {
    export type Interface = INextjsConfigGateway;
    export type NextjsConfigDTO = string;
}
