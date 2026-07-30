import { createAbstraction } from "@webiny/feature/admin";
import type { ICustomIcon } from "~/features/iconPicker/listCustomIcons/abstractions.js";

export interface ICustomIconsViewModel {
    loading: boolean;
    icons: ICustomIcon[];
}

export interface ICustomIconsPresenter {
    readonly vm: ICustomIconsViewModel;
    load(): Promise<ICustomIcon[]>;
}

export const CustomIconsPresenter = createAbstraction<ICustomIconsPresenter>(
    "IconPicker/CustomIconsPresenter"
);

export namespace CustomIconsPresenter {
    export type Interface = ICustomIconsPresenter;
    export type ViewModel = ICustomIconsViewModel;
}
