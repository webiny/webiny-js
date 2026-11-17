import { AssistantClientTools as Abstraction } from "./abstractions.js";

interface Entry {
    owner: Abstraction.Owner;
    tools: Abstraction.Tool[];
}

/*
 * Not observable, since nothing renders it: the assistant reads it when it sends a request and when
 * it runs a call.
 */
class AssistantClientToolsImpl implements Abstraction.Interface {
    private entries: Entry[] = [];

    register(tools: Abstraction.Tool[]): Abstraction.Owner {
        const owner = Symbol("AssistantClientToolsOwner");
        this.entries.push({ owner, tools });
        return owner;
    }

    unregister(owner: Abstraction.Owner): void {
        this.entries = this.entries.filter(entry => entry.owner !== owner);
    }

    list(): Abstraction.Tool[] {
        const byName = new Map<string, Abstraction.Tool>();
        for (const entry of this.entries) {
            for (const tool of entry.tools) {
                byName.set(tool.name, tool);
            }
        }
        return [...byName.values()];
    }

    get(name: string): Abstraction.Tool | undefined {
        return this.list().find(tool => tool.name === name);
    }
}

export const AssistantClientTools = Abstraction.createImplementation({
    implementation: AssistantClientToolsImpl,
    dependencies: []
});
