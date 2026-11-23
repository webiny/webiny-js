import { makeAutoObservable } from "mobx";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { BoundWorkflowPresenter as Abstraction } from "./abstractions.js";

/*
 * Whether a content list's namespace (a CMS model, the Website Builder pages) is bound to a
 * workflow. `GetBoundWorkflowUseCase` reads the app's workflow list once and shares it (one request
 * in flight, cached until a workflow is stored or deleted), so every row asking for the same
 * namespace costs no extra request.
 */
class DefaultBoundWorkflowPresenter implements Abstraction.Interface {
    private status: Abstraction.Status = "loading";
    private namespace: string | null = null;

    constructor(private getBoundWorkflow: GetBoundWorkflowUseCase.Interface) {
        makeAutoObservable<DefaultBoundWorkflowPresenter, "getBoundWorkflow">(this, {
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
            console.error("[BoundWorkflowPresenter] Could not load the bound workflow.", error);
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

export const BoundWorkflowPresenter = Abstraction.createImplementation({
    implementation: DefaultBoundWorkflowPresenter,
    dependencies: [GetBoundWorkflowUseCase]
});
