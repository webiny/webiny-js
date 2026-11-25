import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { AssistantComposerControls as Abstraction } from "./abstractions.js";

interface Entry {
    owner: Abstraction.Owner;
    controls: Abstraction.Control[];
}

/*
 * Observable, unlike the page context and the client tools: the composer renders these, so it has
 * to see a screen add or remove them. Held by reference and replaced on each change, so the elements
 * themselves are never made observable.
 */
class AssistantComposerControlsImpl implements Abstraction.Interface {
    private entries: Entry[] = [];

    constructor() {
        makeAutoObservable<AssistantComposerControlsImpl, "entries">(this, {
            entries: observableRef
        });
    }

    register(controls: Abstraction.Control[]): Abstraction.Owner {
        const owner = Symbol("AssistantComposerControlsOwner");
        this.entries = [...this.entries, { owner, controls }];
        return owner;
    }

    unregister(owner: Abstraction.Owner): void {
        this.entries = this.entries.filter(entry => entry.owner !== owner);
    }

    list(): Abstraction.Control[] {
        const byName = new Map<string, Abstraction.Control>();
        for (const entry of this.entries) {
            for (const control of entry.controls) {
                byName.delete(control.name);
                byName.set(control.name, control);
            }
        }
        return [...byName.values()];
    }

    values(): Record<string, unknown> {
        const values: Record<string, unknown> = {};
        for (const control of this.list()) {
            const value = control.value();
            if (value !== undefined) {
                values[control.name] = value;
            }
        }
        return values;
    }
}

export const AssistantComposerControls = Abstraction.createImplementation({
    implementation: AssistantComposerControlsImpl,
    dependencies: []
});
