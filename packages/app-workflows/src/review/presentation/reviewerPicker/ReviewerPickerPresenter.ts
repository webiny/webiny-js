import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewerPickerPresenter as Abstraction } from "./abstractions.js";
import type { ReviewerPickerOptionVm } from "./abstractions.js";
import type { ReviewerPickerInitParams } from "./abstractions.js";
import { getPickerOptions } from "./getPickerOptions.js";

class ReviewerPickerPresenterImpl implements Abstraction.Interface {
    private params: ReviewerPickerInitParams | null = null;
    private candidates: StepCandidate[] = [];
    private value: string | null = null;
    private loading = false;
    private error: string | null = null;
    private query = "";
    private token = 0;

    constructor() {
        makeAutoObservable<ReviewerPickerPresenterImpl, "token" | "params" | "candidates">(this, {
            token: false,
            params: observableRef,
            candidates: observableRef
        });
    }

    get vm(): Abstraction.ViewModel {
        const all = this.getAllOptions();
        const needle = this.query.trim().toLowerCase();
        const matching = this.candidates.filter(candidate => {
            return candidate.displayName.toLowerCase().includes(needle);
        });
        const currentOwnerId = this.getCurrentOwnerId();
        const options = getPickerOptions(matching, currentOwnerId);
        const eligibleCount = all.filter(option => !option.disabled).length;

        let emptyMessage = "No reviewers to show.";
        if (needle !== "") {
            emptyMessage = `Nothing matches “${this.query.trim()}”.`;
        }

        return {
            options,
            value: this.value,
            loading: this.loading,
            error: this.error,
            query: this.query,
            emptyMessage,
            eligibleCount
        };
    }

    async init(params: ReviewerPickerInitParams): Promise<void> {
        const token = this.begin(params);

        try {
            const loaded = await params.load();
            if (token !== this.token) {
                return;
            }
            this.applyLoaded(loaded);
        } catch {
            if (token !== this.token) {
                return;
            }
            this.applyFailure();
        }
    }

    search(query: string): void {
        this.query = query;
    }

    select(id: string): void {
        const option = this.getAllOptions().find(item => item.value === id);
        if (!option || option.disabled) {
            return;
        }
        this.value = id;
    }

    async retry(): Promise<void> {
        if (!this.params) {
            return;
        }
        await this.init({ ...this.params, selectedId: this.value });
    }

    dispose(): void {
        this.token += 1;
        this.params = null;
        this.candidates = [];
        this.value = null;
        this.loading = false;
        this.error = null;
        this.query = "";
    }

    private getCurrentOwnerId(): string | null {
        return this.params ? this.params.currentOwnerId : null;
    }

    private getAllOptions(): ReviewerPickerOptionVm[] {
        const currentOwnerId = this.getCurrentOwnerId();
        return getPickerOptions(this.candidates, currentOwnerId);
    }

    private begin(params: ReviewerPickerInitParams): number {
        this.token += 1;
        this.params = params;
        this.candidates = [];
        this.value = params.selectedId;
        this.loading = true;
        this.error = null;
        this.query = "";
        return this.token;
    }

    private applyLoaded(candidates: StepCandidate[]): void {
        this.candidates = candidates;
        this.loading = false;
    }

    private applyFailure(): void {
        this.loading = false;
        this.error = "Could not load results.";
    }
}

export const ReviewerPickerPresenter = Abstraction.createImplementation({
    implementation: ReviewerPickerPresenterImpl,
    dependencies: []
});
