import { createAbstraction } from "@webiny/feature/admin";

/** A single form row: the control or a variant, with its traffic weight and analytics key. */
export interface FormBucket {
    id: string;
    isControl: boolean;
    name: string;
    key: string;
    keyEdited: boolean;
    description: string;
    weight: number;
    // CMS revision id of an existing variant (edit mode); absent for control and new variants.
    revisionId?: string;
}

export interface ExperimentFormInitial {
    name: string;
    key: string;
    buckets: FormBucket[];
}

export interface NewExperimentPayload {
    name: string;
    key: string;
    control: { key: string; description: string; weight: number };
    variants: Array<{
        id: string;
        revisionId?: string;
        name: string;
        key: string;
        description: string;
        weight: number;
    }>;
}

export interface IExperimentFormViewModel {
    name: string;
    key: string;
    buckets: FormBucket[];
    total: number;
    variantCount: number;
    canSubmit: boolean;
    submitLabel: string;
    allowStructureChange: boolean;
}

export interface IExperimentFormPresenter {
    vm: IExperimentFormViewModel;
    init(
        initial: ExperimentFormInitial | undefined,
        options: {
            submitLabel: string;
            allowStructureChange: boolean;
            onSubmit: (payload: NewExperimentPayload) => void;
        }
    ): void;
    setName(value: string): void;
    setKey(value: string): void;
    addVariant(): void;
    removeVariant(index: number): void;
    changeWeight(index: number, value: number): void;
    changeName(index: number, value: string): void;
    changeKey(index: number, value: string): void;
    changeDescription(index: number, value: string): void;
    submit(): void;
}

export const ExperimentFormPresenter =
    createAbstraction<IExperimentFormPresenter>("ExperimentFormPresenter");

export namespace ExperimentFormPresenter {
    export type Interface = IExperimentFormPresenter;
    export type ViewModel = IExperimentFormViewModel;
}
