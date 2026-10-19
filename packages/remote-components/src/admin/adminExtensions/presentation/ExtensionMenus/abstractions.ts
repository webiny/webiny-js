import { createAbstraction } from "@webiny/feature/admin";

/** One sidebar item, ready to hand to `AdminConfig.Menu`. */
export interface IExtensionMenuViewModel {
    name: string;
    label: string;
    to: string;
    parent: string | null;
    pinnable: boolean;
}

export interface IExtensionMenusViewModel {
    menus: IExtensionMenuViewModel[];
}

export interface IExtensionMenusPresenter {
    readonly vm: IExtensionMenusViewModel;
    /** Loads the menus whenever someone signs in, and drops them on sign-out. */
    start(): void;
    stop(): void;
    /** Loads again, after an extension was enabled, disabled or deleted. */
    reload(): Promise<void>;
}

export const ExtensionMenusPresenter = createAbstraction<IExtensionMenusPresenter>(
    "RemoteComponents/ExtensionMenusPresenter"
);

export namespace ExtensionMenusPresenter {
    export type Interface = IExtensionMenusPresenter;
    export type ViewModel = IExtensionMenusViewModel;
    export type Menu = IExtensionMenuViewModel;
}
