import { AssistantClientTools as Abstraction } from "./abstractions.js";

/** Reported for a call whose screen was left between the call and running it. */
const TOOL_GONE = "The screen that runs this tool is no longer open.";

const messageOf = (error: unknown): string => {
    return error instanceof Error ? error.message : String(error);
};

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

    private isRegistered(tool: Abstraction.Tool): boolean {
        return this.entries.some(entry => entry.tools.includes(tool));
    }

    /*
     * Runs one tool call the model asked for, in the browser: the model can't change the screen
     * itself, so the server stops and hands the call here. The result goes back to the server in
     * the next request, and the model carries on from it. Never throws: the server only carries on
     * once every waiting call has a result, so a failure comes back as an `error` result the model
     * can read and react to.
     */
    async run(call: Abstraction.Call, offered: Abstraction.Tool[]): Promise<Abstraction.Result> {
        const { toolCallId, toolName } = call;
        const tool = offered.find(candidate => candidate.name === toolName);
        if (!tool || !this.isRegistered(tool)) {
            return { toolCallId, toolName, error: TOOL_GONE };
        }

        try {
            const output = await tool.execute(call.input);
            return { toolCallId, toolName, output: output ?? null };
        } catch (error) {
            return { toolCallId, toolName, error: messageOf(error) };
        }
    }
}

export const AssistantClientTools = Abstraction.createImplementation({
    implementation: AssistantClientToolsImpl,
    dependencies: []
});
