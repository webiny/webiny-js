import { createAbstraction } from "@webiny/feature/admin";
import type { Banners } from "~/features/banners/abstractions.js";

export interface IBannerViewModel {
    id: string;
    variant: Banners.Variant;
    title: string | null;
    message: string;
    dismissible: boolean;
    actionLabel: string | null;
    actionDisabled: boolean;
}

export interface IBannersViewModel {
    // The one banner on screen, or null when there is none.
    banner: IBannerViewModel | null;
}

export interface IBannersPresenter {
    readonly vm: IBannersViewModel;
    runAction(): void;
    dismiss(): void;
}

export const BannersPresenter = createAbstraction<IBannersPresenter>("BannersPresenter");

export namespace BannersPresenter {
    export type Interface = IBannersPresenter;
    export type ViewModel = IBannersViewModel;
    export type Banner = IBannerViewModel;
}
