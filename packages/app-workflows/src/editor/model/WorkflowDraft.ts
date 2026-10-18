import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorWorkflow } from "~/editor/domain/types.js";
import type { EditorWorkflowInput } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "./EditorStepPatch.js";
import { isEqualJson } from "./isEqualJson.js";
import { toStepInput } from "./toStepInput.js";

export interface NewDraftParams {
    id: string;
    name: string;
    models: string[];
}

/*
 * The workflow being edited (R276). The presenter owns the one instance and never lets it reach a
 * component (R234). `baseline` is the loaded workflow; `null` while a draft is open means a draft
 * that was never saved (Create workflow, Save as new), which is dirty from the start. `steps` is
 * replaced, never mutated, and observed by reference so a step's untyped `config` never becomes a
 * MobX proxy.
 */
export class WorkflowDraft {
    private open = false;
    private baseline: EditorWorkflow | null = null;
    private _id = "";
    private _name = "";
    private _models: string[] = [];
    private _steps: EditorStep[] = [];

    constructor() {
        makeAutoObservable<WorkflowDraft, "baseline" | "_models" | "_steps">(this, {
            baseline: observableRef,
            _models: observableRef,
            _steps: observableRef
        });
    }

    get isOpen(): boolean {
        return this.open;
    }

    get isNew(): boolean {
        return this.open && this.baseline === null;
    }

    get id(): string {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get models(): string[] {
        return this._models;
    }

    get steps(): EditorStep[] {
        return this._steps;
    }

    // The loaded string, sent back unchanged (Review Focus 1); null for a draft never saved.
    get savedOn(): string | null {
        return this.baseline === null ? null : this.baseline.savedOn;
    }

    get isDirty(): boolean {
        if (!this.open) {
            return false;
        }
        if (this.baseline === null) {
            return true;
        }
        if (this._name !== this.baseline.name) {
            return true;
        }
        return !isEqualJson(this._steps, this.baseline.steps);
    }

    getBaselineStep(stepId: string): EditorStep | null {
        if (this.baseline === null) {
            return null;
        }
        const step = this.baseline.steps.find(item => item.id === stepId);
        return step ?? null;
    }

    reset(workflow: EditorWorkflow | null): void {
        if (workflow === null) {
            this.open = false;
            this.baseline = null;
            this._id = "";
            this._name = "";
            this._models = [];
            this._steps = [];
            return;
        }
        this.open = true;
        this.baseline = workflow;
        this._id = workflow.id;
        this._name = workflow.name;
        this._models = [...workflow.models];
        this._steps = [...workflow.steps];
    }

    startNew(params: NewDraftParams): void {
        this.open = true;
        this.baseline = null;
        this._id = params.id;
        this._name = params.name;
        this._models = [...params.models];
        this._steps = [];
    }

    // Save as new (R276): the same content and id, nothing saved to compare with.
    detachBaseline(): void {
        this.baseline = null;
    }

    setName(name: string): void {
        this._name = name;
    }

    addStep(index: number, step: EditorStep): void {
        const clamped = Math.max(0, Math.min(index, this._steps.length));
        const steps = [...this._steps];
        steps.splice(clamped, 0, step);
        this._steps = steps;
    }

    updateStep(stepId: string, patch: EditorStepPatch): void {
        this._steps = this._steps.map(step => {
            return step.id === stepId ? { ...step, ...patch } : step;
        });
    }

    moveStep(from: number, to: number): void {
        const last = this._steps.length - 1;
        if (from === to || from < 0 || from > last || to < 0 || to > last) {
            return;
        }
        const steps = [...this._steps];
        const [moved] = steps.splice(from, 1);
        steps.splice(to, 0, moved);
        this._steps = steps;
    }

    removeStep(stepId: string): void {
        this._steps = this._steps.filter(step => step.id !== stepId);
    }

    toInput(): EditorWorkflowInput {
        return {
            id: this._id,
            name: this._name,
            models: [...this._models],
            steps: this._steps.map(toStepInput)
        };
    }
}
