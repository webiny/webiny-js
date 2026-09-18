import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core/features/events/RequestContainer.js";
import { AiSdkToolDefinition, AiSdkToolHandler, AiSdkTools } from "~/features/ai/index.js";
import { AiSdkToolHandlerResolver } from "~/features/ai/AiSdkToolHandlerResolver.js";
import { AiSdkTools as AiSdkToolsImpl } from "~/features/ai/AiSdkTools.js";

type ToolSet = ReturnType<AiSdkTools.Interface["getToolSet"]>;

const inputSchema = z.object({ value: z.string().optional() });

/** Records construction, so a test can tell "was it built" apart from "was it called". */
const built: string[] = [];

class FirstHandlerImpl implements AiSdkToolHandler.Interface {
    constructor() {
        built.push("first");
    }

    async execute(input: { value?: string }) {
        return `first:${input.value ?? ""}`;
    }
}

const FirstHandler = AiSdkToolHandler.createImplementation({
    implementation: FirstHandlerImpl,
    dependencies: []
});

class SecondHandlerImpl implements AiSdkToolHandler.Interface {
    constructor() {
        built.push("second");
    }

    async execute(input: { value?: string }) {
        return `second:${input.value ?? ""}`;
    }
}

const SecondHandler = AiSdkToolHandler.createImplementation({
    implementation: SecondHandlerImpl,
    dependencies: []
});

class FirstToolImpl implements AiSdkToolDefinition.Interface {
    readonly name = "first";
    readonly description = "The first tool.";
    readonly inputSchema = inputSchema;
    readonly handler = FirstHandler;
}

const FirstTool = AiSdkToolDefinition.createImplementation({
    implementation: FirstToolImpl,
    dependencies: []
});

class SecondToolImpl implements AiSdkToolDefinition.Interface {
    readonly name = "second";
    readonly description = "The second tool.";
    readonly inputSchema = inputSchema;
    readonly handler = SecondHandler;
}

const SecondTool = AiSdkToolDefinition.createImplementation({
    implementation: SecondToolImpl,
    dependencies: []
});

const setup = (): ToolSet => {
    built.length = 0;

    const container = new Container();
    container.registerInstance(RequestContainer, container);
    container.register(AiSdkToolHandlerResolver);
    container.register(FirstTool);
    container.register(SecondTool);
    container.register(AiSdkToolsImpl);

    return container.resolve(AiSdkTools).getToolSet();
};

const callTool = (toolSet: ToolSet, name: string) => {
    const tool = toolSet[name];
    const execute = tool?.execute;

    if (!execute) {
        throw new Error(`Tool "${name}" is missing from the tool set.`);
    }

    return (input: unknown) => execute(input, { toolCallId: "1", messages: [] });
};

describe("AiSdkTools", () => {
    it("builds the tool set without constructing any handler", () => {
        const toolSet = setup();

        expect(Object.keys(toolSet).sort()).toEqual(["first", "second"]);
        expect(built).toEqual([]);
    });

    it("constructs a handler only when its own tool is called", async () => {
        const toolSet = setup();

        const result = await callTool(toolSet, "first")({ value: "x" });

        expect(result).toBe("first:x");
        // Not ["first", "second"]: calling one tool must not drag the other's dependencies in.
        expect(built).toEqual(["first"]);
    });

    it("routes each tool to its own handler", async () => {
        const toolSet = setup();

        const first = await callTool(toolSet, "first")({ value: "a" });
        const second = await callTool(toolSet, "second")({ value: "b" });

        expect([first, second]).toEqual(["first:a", "second:b"]);
    });
});
