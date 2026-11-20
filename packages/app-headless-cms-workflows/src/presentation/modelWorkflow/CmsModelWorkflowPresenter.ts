import { makeAutoObservable } from "mobx";
import { GetBoundWorkflowUseCase } from "@webiny/app-workflows/review/useCases/getBoundWorkflow/abstractions.js";
import { CmsModelWorkflowPresenter as Abstraction } from "./abstractions.js";

/*
 * Whether the list's model is bound to a workflow. `GetBoundWorkflowUseCase` reads the app's
 * workflow list once and shares it (one request in flight, cached until a workflow is stored or
 * deleted), so every row asking for the same model costs no extra request.
 */
class CmsModelWorkflowPresenterImpl implements Abstraction.Interface {
    private status: Abstraction.Status = "loading";
    private namespace: string | null = null;

    constructor(private getBoundWorkflow: GetBoundWorkflowUseCase.Interface) {
        makeAutoObservable<CmsModelWorkflowPresenterImpl, "getBoundWorkflow">(this, {
            getBoundWorkflow: false
        });
    }

    get vm(): Abstraction.ViewModel {
        return { status: this.status };
    }

    async load(namespace: string): Promise<void> {
        this.start(namespace);

        try {
            const workflow = await this.getBoundWorkflow.execute({ namespace });
            this.apply(namespace, workflow === null ? "unbound" : "bound");
        } catch (error) {
            console.error("[CmsModelWorkflowPresenter] Could not load the bound workflow.", error);
            this.apply(namespace, "failed");
        }
    }

    private start(namespace: string): void {
        if (this.namespace !== namespace) {
            this.status = "loading";
        }
        this.namespace = namespace;
    }

    private apply(namespace: string, status: Abstraction.Status): void {
        // A newer namespace owns the state now.
        if (this.namespace !== namespace) {
            return;
        }
        this.status = status;
    }
}

export const CmsModelWorkflowPresenter = Abstraction.createImplementation({
    implementation: CmsModelWorkflowPresenterImpl,
    dependencies: [GetBoundWorkflowUseCase]
});
