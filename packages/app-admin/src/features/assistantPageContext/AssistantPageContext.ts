import { AssistantPageContext as Abstraction } from "./abstractions.js";

interface Entry {
    owner: Abstraction.Owner;
    context: Abstraction.Data;
}

/*
 * A stack, newest last: a drawer that describes itself over a page that does too is what the user
 * is looking at, and closing it hands the page's context back. Not observable, since nothing renders
 * it; the assistant reads it at the moment a question is asked.
 */
class AssistantPageContextImpl implements Abstraction.Interface {
    private entries: Entry[] = [];

    set(context: Abstraction.Data): Abstraction.Owner {
        const owner = Symbol("AssistantPageContextOwner");
        this.entries.push({ owner, context });
        return owner;
    }

    clear(owner: Abstraction.Owner): void {
        this.entries = this.entries.filter(entry => entry.owner !== owner);
    }

    get(): Abstraction.Data | null {
        const newest = this.entries[this.entries.length - 1];
        return newest?.context ?? null;
    }
}

export const AssistantPageContext = Abstraction.createImplementation({
    implementation: AssistantPageContextImpl,
    dependencies: []
});
