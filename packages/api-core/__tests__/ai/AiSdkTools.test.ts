import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core/features/events/RequestContainer.js";
import { AiSdkTool, AiSdkToolHandler, AiSdkTools } from "~/features/ai/index.js";
import { AiSdkToolHandlerResolver } from "~/features/ai/AiSdkToolHandlerResolver.js";
import { AiSdkTools as AiSdkToolsImpl } from "~/features/ai/AiSdkTools.js";
import { AiSdkToolNotExecutableError } from "~/features/ai/errors.js";

const inputSchema = z.object({ value: z.string().optional() });

/** Counts construction so a test can tell "was it built" apart from "was it called". */
const built: string[] = [];

class CountingHandlerImpl implements AiSdkToolHandler.Interface {
    constructor() {
        built.push("counting");
    }

    async execute(input: { value?: string }) {
        return `handled:${input.value ?? ""}`;
    }
}

const CountingHandler = AiSdkToolHandler.createImplementation({
    implementation: CountingHandlerImpl,
    dependencies: []
});

class SplitToolImpl implements AiSdkTool.Interface {
    readonly name = "split";
    readonly description = "A tool that names a handler.";
    readonly inputSchema = inputSchema;
    readonly handler = CountingHandler;
}

const SplitTool = AiSdkTool.createImplementation({
    implementation: SplitToolImpl,
    dependencies: []
});

/** The pre-split shape, which has to keep working while packages migrate. */
class InlineToolImpl implements AiSdkTool.Interface {
    readonly name = "inline";
    readonly description = "A tool that still carries its own execute.";
    readonly inputSchema = inputSchema;

    async execute(input: { value?: string }) {
        return `inline:${input.value ?? ""}`;
    }
}

const InlineTool = AiSdkTool.createImplementation({
    implementation: InlineToolImpl,
    dependencies: []
});

class BrokenToolImpl implements AiSdkTool.Interface {
    readonly name = "broken";
    readonly description = "A tool that declares neither.";
    readonly inputSchema = inputSchema;
}

const BrokenTool = AiSdkTool.createImplementation({
    implementation: BrokenToolImpl,
    dependencies: []
});

const setup = () => {
    built.length = 0;

    const container = new Container();
    container.registerInstance(RequestContainer, container);
    container.register(AiSdkToolHandlerResolver);
    container.register(SplitTool);
    container.register(InlineTool);
    container.register(BrokenTool);
    container.register(AiSdkToolsImpl);

    return container;
};

const callTool = (toolSet: ReturnType<AiSdkTools.Interface["getToolSet"]>, name: string) => {
    const tool = toolSet[name];

    if (!tool?.execute) {
        throw new Error(`Tool "${name}" is missing from the tool set.`);
    }

    return tool.execute;
};

describe("AiSdkTools", () => {
    it("builds the tool set without constructing any handler", () => {
        const container = setup();

        const toolSet = container.resolve(AiSdkTools).getToolSet();

        expect(Object.keys(toolSet).sort()).toEqual(["broken", "inline", "split"]);
        expect(built).toEqual([]);
    });

    it("constructs the handler only when the tool is called", async () => {
        const container = setup();
        const toolSet = container.resolve(AiSdkTools).getToolSet();

        expect(built).toEqual([]);

        const execute = callTool(toolSet, "split");
        const result = await execute({ value: "x" }, { toolCallId: "1", messages: [] });

        expect(result).toBe("handled:x");
        expect(built).toEqual(["counting"]);
    });

    it("still runs a tool that carries its own execute", async () => {
        const container = setup();
        const toolSet = container.resolve(AiSdkTools).getToolSet();

        const execute = callTool(toolSet, "inline");
        const result = await execute({ value: "y" }, { toolCallId: "1", messages: [] });

        expect(result).toBe("inline:y");
    });

    it("reports a tool that declares neither, rather than failing obscurely", () => {
        const container = setup();
        const toolSet = container.resolve(AiSdkTools).getToolSet();

        const execute = callTool(toolSet, "broken");

        expect(() => execute({}, { toolCallId: "1", messages: [] })).toThrow(
            AiSdkToolNotExecutableError
        );
    });
});
