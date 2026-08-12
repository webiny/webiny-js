import { createAbstraction } from "@webiny/feature/admin";
import type { ThemeOptionDto } from "~/shared/types.js";

export interface ICreateJobVm {
    name: string;
    siteUrl: string;
    /** The selected theme's revision id (`entryId#version`); "" when none is chosen. */
    themeId: string;
    pageCap: string;
    themes: ThemeOptionDto[];
    loadingThemes: boolean;
    creating: boolean;
    error: string | null;
}

export interface ICreateJobPresenter {
    vm: ICreateJobVm;
    init(): Promise<void>;
    setName(value: string): void;
    setSiteUrl(value: string): void;
    setTheme(themeId: string): void;
    setPageCap(value: string): void;
    /** Creates the job and its first run, returning the new run's id. Throws on validation/API error. */
    create(): Promise<string>;
    reset(): void;
}

export const CreateJobPresenter = createAbstraction<ICreateJobPresenter>(
    "ComponentExtraction/CreateJobPresenter"
);

export namespace CreateJobPresenter {
    export type Interface = ICreateJobPresenter;
    export type ViewModel = ICreateJobVm;
}
