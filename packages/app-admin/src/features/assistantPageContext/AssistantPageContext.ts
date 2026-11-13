import { AssistantPageContext as Abstraction } from "./abstractions.js";

/*
 * One context at a time: the screen in front of the user. Not observable, since nothing renders it;
 * the assistant reads it at the moment a question is asked.
 */
class AssistantPageContextImpl implements Abstraction.Interface {
    private current: { owner: Abstraction.Owner; context: Abstraction.Data } | null = null;

    set(context: Abstraction.Data): Abstraction.Owner {
        const owner = Symbol("AssistantPageContextOwner");
        this.current = { owner, context };
        return owner;
    }

    clear(owner: Abstraction.Owner): void {
        if (this.current?.owner === owner) {
            this.current = null;
        }
    }

    get(): Abstraction.Data | null {
        return this.current?.context ?? null;
    }
}

export const AssistantPageContext = Abstraction.createImplementation({
    implementation: AssistantPageContextImpl,
    dependencies: []
});
