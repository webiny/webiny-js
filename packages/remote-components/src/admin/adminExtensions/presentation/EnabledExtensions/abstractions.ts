import { createAbstraction } from "@webiny/feature/admin";
import type { GeneratedCmsFieldRenderers } from "~/admin/adminExtensions/features/cmsFieldRenderers/abstractions.js";

/** One sidebar item, ready to hand to `AdminConfig.Menu`. */
export interface IExtensionMenuViewModel {
    name: string;
    label: string;
    to: string;
    parent: string | null;
    pinnable: boolean;
}

export interface IEnabledExtensionsViewModel {
    menus: IExtensionMenuViewModel[];
    fieldRenderers: GeneratedCmsFieldRenderers.Loaded[];
}

export interface IEnabledExtensionsPresenter {
    readonly vm: IEnabledExtensionsViewModel;
    /** Loads enabled extensions whenever someone signs in, and drops them on sign-out. */
    start(): void;
    stop(): void;
    /** Loads again, after an extension was enabled, disabled or deleted. */
    reload(): Promise<void>;
}

/** Every enabled admin extension the signed-in user's admin runs, by kind. */
export const EnabledExtensionsPresenter = createAbstraction<IEnabledExtensionsPresenter>(
    "RemoteComponents/EnabledExtensionsPresenter"
);

export namespace EnabledExtensionsPresenter {
    export type Interface = IEnabledExtensionsPresenter;
    export type ViewModel = IEnabledExtensionsViewModel;
    export type Menu = IExtensionMenuViewModel;
    export type FieldRenderer = GeneratedCmsFieldRenderers.Loaded;
}
