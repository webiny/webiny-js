import { createAbstraction } from "@webiny/feature/admin";
import type { ReachabilityDto, ThemeOptionDto } from "~/shared/types.js";

/** The gate-config presets (spec §3): pause at every stage, at the URL list and plan only, or Custom. */
export type GatePreset = "every" | "urlAndPlan" | "custom";

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
    /** Reachability pre-flight (spec §3): the last result, and whether a check is in flight. */
    checkingReachability: boolean;
    reachability: ReachabilityDto | null;
    /** Gate configuration: the active preset and the stages the run pauses after. */
    gatePreset: GatePreset;
    stopAfter: string[];
}

export interface ICreateJobPresenter {
    vm: ICreateJobVm;
    init(): Promise<void>;
    setName(value: string): void;
    setSiteUrl(value: string): void;
    setTheme(themeId: string): void;
    setPageCap(value: string): void;
    /** Runs the reachability pre-flight against the current site URL. */
    checkReachability(): Promise<void>;
    setGatePreset(preset: GatePreset): void;
    toggleGate(stage: string): void;
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
