import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";

export interface ICreateComponentVm {
    form: IFormVM;
    generating: boolean;
    createdId: string | null;
    error: string | null;
}

export interface ICreateComponentPresenter {
    vm: ICreateComponentVm;
    generate(): Promise<void>;
    processAiResponse(data: { id: string }): void;
    cancelGeneration(): void;
}

export const CreateComponentPresenter = createAbstraction<ICreateComponentPresenter>(
    "RemoteComponents/CreateComponentPresenter"
);

export namespace CreateComponentPresenter {
    export type Interface = ICreateComponentPresenter;
    export type ViewModel = ICreateComponentVm;
}
