import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { WorkflowEditorOptions } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowTeamOptions } from "~/editor/presentation/editor/abstractions.js";
import type { StepDrawerSource } from "~/editor/presentation/stepDrawer/abstractions.js";
import { createEditorOptions } from "./createEditorOptions.js";
import { createTeamOptions } from "./createTeamOptions.js";

/*
 * The accessors of the editor presenter the drawer reads, over plain MobX state, so the drawer's
 * reactions fire when a list or the read-only state changes. The commands are mocks.
 */
export class FakeStepDrawerSource implements StepDrawerSource {
    steps: EditorStep[];
    options: WorkflowEditorOptions = createEditorOptions();
    teams: WorkflowTeamOptions = createTeamOptions();
    readOnly = false;
    errors: StepFieldError[] = [];
    namespace: string | null = "cms.article";
    updateStep: Mock<(stepId: string, patch: EditorStepPatch) => void> = vi.fn();
    closeStep: Mock<() => void> = vi.fn();
    searchTeams: Mock<(search: string) => void> = vi.fn();
    retryTeams: Mock<() => Promise<void>> = vi.fn().mockResolvedValue(undefined);
    retryOptions: Mock<() => Promise<void>> = vi.fn().mockResolvedValue(undefined);

    constructor(steps: EditorStep[]) {
        this.steps = steps;
        makeAutoObservable(this, {
            steps: observableRef,
            options: observableRef,
            teams: observableRef,
            errors: observableRef,
            updateStep: false,
            closeStep: false,
            searchTeams: false,
            retryTeams: false,
            retryOptions: false
        });
    }

    getStep(stepId: string): EditorStep | null {
        return this.steps.find(step => step.id === stepId) ?? null;
    }

    getStepFieldErrors(): StepFieldError[] {
        return this.errors;
    }

    isStepReadOnly(): boolean {
        return this.readOnly;
    }

    getOptions(): WorkflowEditorOptions {
        return this.options;
    }

    getTeamOptions(): WorkflowTeamOptions {
        return this.teams;
    }

    getNamespace(): string | null {
        return this.namespace;
    }

    setSteps(steps: EditorStep[]): void {
        this.steps = steps;
    }

    setOptions(options: WorkflowEditorOptions): void {
        this.options = options;
    }

    setTeams(teams: WorkflowTeamOptions): void {
        this.teams = teams;
    }

    setReadOnly(readOnly: boolean): void {
        this.readOnly = readOnly;
    }
}
