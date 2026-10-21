import { createAbstraction } from "@webiny/feature/admin";
import type { WbStatus } from "~/constants.js";
import type { Layout } from "~/features/layouts/index.js";

export interface ILayoutLanguageOption {
    code: string;
    label: string;
}

// A language version of a source layout.
export interface ILayoutVersionVm {
    layout: Layout;
    language: string;
    languageLabel: string;
    status: WbStatus;
    version: number;
    // Version of the published revision, or `null`.
    liveVersion: number | null;
}

// A source layout, with its language versions.
export interface ILayoutRowVm {
    layout: Layout;
    title: string;
    // The slug code names it by; `null` on an older layout that has none yet.
    slug: string | null;
    language: string | null;
    languageLabel: string | null;
    status: WbStatus;
    version: number;
    liveVersion: number | null;
    isDefault: boolean;
    // Only a source layout with a published revision can be the default layout.
    canSetDefault: boolean;
    versions: ILayoutVersionVm[];
    // Languages it has no version in yet, to translate it into.
    translatableLanguages: ILayoutLanguageOption[];
}

export interface ILayoutsListVm {
    rows: ILayoutRowVm[];
    loading: boolean;
    // Whether the site has languages: without them, layouts have no language versions.
    hasLanguages: boolean;
}

/**
 * The layouts list: source layouts with their language versions. Runs the row actions, notifying about
 * the outcome (a layout in use can't be deleted, which is explained).
 */
export interface ILayoutsListPresenter {
    readonly vm: ILayoutsListVm;
    init(): Promise<void>;
    // The confirmation shown before deleting a layout, naming the language versions deleted with it.
    getDeleteConfirmation(layout: Layout): string;
    // Resolves with whether it was deleted.
    delete(layout: Layout): Promise<boolean>;
    // Resolves with the copy, or `null` if it could not be duplicated.
    duplicate(layout: Layout): Promise<Layout | null>;
    // Resolves with the new language version, or `null` if it could not be created.
    translate(layout: Layout, language: string): Promise<Layout | null>;
    // Make a source layout the default layout of new pages, or clear the default with `null`.
    setDefault(layout: Layout | null): Promise<void>;
}

export const LayoutsListPresenter = createAbstraction<ILayoutsListPresenter>(
    "WebsiteBuilder/LayoutsListPresenter"
);

export namespace LayoutsListPresenter {
    export type Interface = ILayoutsListPresenter;
    export type ViewModel = ILayoutsListVm;
    export type RowViewModel = ILayoutRowVm;
    export type VersionViewModel = ILayoutVersionVm;
    export type LanguageOption = ILayoutLanguageOption;
}
