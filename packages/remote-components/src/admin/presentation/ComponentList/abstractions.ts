import { createAbstraction } from "@webiny/feature/admin";
import type { RemoteComponentDto } from "~/shared/types.js";

export interface IComponentListVm {
    loading: boolean;
    components: RemoteComponentDto[];
    error: string | null;
}

export interface IComponentListPresenter {
    vm: IComponentListVm;
    init(): Promise<void>;
    deleteComponent(id: string): Promise<void>;
}

export const ComponentListPresenter = createAbstraction<IComponentListPresenter>(
    "RemoteComponents/ComponentListPresenter"
);

export namespace ComponentListPresenter {
    export type Interface = IComponentListPresenter;
    export type ViewModel = IComponentListVm;
}
