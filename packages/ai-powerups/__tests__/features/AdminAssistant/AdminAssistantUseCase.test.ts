import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Ai, AiSdkTools } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Result } from "@webiny/feature/api";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import { AiCapabilityNotConfiguredError } from "~/api/features/Capabilities/index.js";
import {
    AdminAssistantConfig,
    AdminAssistantUseCase
} from "~/api/features/AdminAssistant/abstractions.js";
import { AdminAssistantUseCase as AdminAssistantUseCaseImplementation } from "~/api/features/AdminAssistant/AdminAssistantUseCase.js";
import { ADMIN_ASSISTANT_CAPABILITY } from "~/api/features/AdminAssistant/capability.js";
import { SYSTEM_PROMPT } from "~/api/features/AdminAssistant/systemPrompt.js";
import type { AdminAssistantEvent } from "~/api/features/AdminAssistant/events.js";
import type { AdminAssistantParams } from "~/api/features/AdminAssistant/abstractions.js";
import { GetAiChatUseCase } from "~/api/features/AiChats/GetAiChat/index.js";
import { SaveAiChatUseCase } from "~/api/features/AiChats/SaveAiChat/index.js";
import { AiChatNotFoundError } from "~/api/features/AiChats/domain/errors.js";
import { AiChatTooLargeError } from "~/api/features/AiChats/domain/errors.js";
import { AiChatPersistenceError } from "~/api/features/AiChats/domain/errors.js";
import type { AiChat } from "~/api/features/AiChats/domain/types.js";
import type { ModelMessage } from "ai";

const ADDITIONAL = "Always answer in Welsh.";

/**
 * A run that streams nothing and ends cleanly.
 *
 * `responseMessages` and `steps` are both awaited after the stream drains, so a fake without them
 * throws at the end and the use case reports an `error` event. The request assertions would still
 * pass, which is exactly the false green worth avoiding.
 */
const emptyStream = (parts: unknown[] = [], responseMessages: ModelMessage[] = []) => ({
    fullStream: (async function* () {
        yield* parts;
    })(),
    response: Promise.resolve({ messages: [] }),
    responseMessages: Promise.resolve(responseMessages),
    steps: Promise.resolve([])
});

interface SetupOptions {
    /** Chats already saved, by id. */
    chats?: Record<string, ModelMessage[]>;
    /** What the run itself adds to the conversation. */
    responseMessages?: ModelMessage[];
    /** Makes every save fail with this error. */
    saveError?: Error;
    /** Makes every save throw this, rather than return a failed result. */
    saveThrows?: Error;
}

const setup = (
    resolution?: Result<never, Error>,
    parts: unknown[] = [],
    options: SetupOptions = {}
) => {
    const requests: Ai.GenerateTextParams[] = [];
    const saves: SaveAiChatUseCase.Input[] = [];
    const container = new Container();
    const existing = Object.entries(options.chats ?? {});
    const chats = new Map(existing);

    container.registerInstance(Ai, {
        streamText: async (request: Ai.StreamTextParams) => {
            requests.push(request as unknown as Ai.GenerateTextParams);
            return emptyStream(parts, options.responseMessages);
        }
    } as unknown as Ai.Interface);

    container.registerInstance(AiSdkTools, { getToolSet: () => ({}) } as AiSdkTools.Interface);

    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ isAnonymous: () => false })
    } as unknown as IdentityContext.Interface);

    container.registerInstance(AdminAssistantConfig, { maxSteps: 12 });

    container.registerInstance(ResolveAiCapabilityUseCase, {
        execute: async () =>
            resolution ??
            Result.ok({
                capabilityId: ADMIN_ASSISTANT_CAPABILITY,
                model: "anthropic/claude-sonnet-4-5",
                connection: { sdkName: "anthropic", apiKey: "sk-test" },
                roleId: "standard",
                fellBackToStandard: false,
                guidance: SYSTEM_PROMPT,
                additionalInstructions: ADDITIONAL
            })
    } as unknown as ResolveAiCapabilityUseCase.Interface);

    const chatOf = (id: string, messages: ModelMessage[]): AiChat => ({
        id,
        title: "Chat",
        createdOn: "2026-11-10T10:00:00.000Z",
        savedOn: "2026-11-10T10:00:00.000Z",
        messages
    });

    const getChat: GetAiChatUseCase.Interface = {
        execute: async (id: string) => {
            const messages = chats.get(id);
            if (!messages) {
                return Result.fail(new AiChatNotFoundError(id));
            }
            const chat = chatOf(id, messages);
            return Result.ok(chat);
        }
    };
    container.registerInstance(GetAiChatUseCase, getChat);

    container.registerInstance(SaveAiChatUseCase, {
        execute: async (input: SaveAiChatUseCase.Input) => {
            saves.push(input);
            if (options.saveThrows) {
                throw options.saveThrows;
            }
            if (options.saveError) {
                return Result.fail(options.saveError);
            }
            const id = input.id ?? "chat-new";
            chats.set(id, input.messages);
            const chat = chatOf(id, input.messages);
            return Result.ok(chat);
        }
    } as unknown as SaveAiChatUseCase.Interface);

    container.register(AdminAssistantUseCaseImplementation);

    return { useCase: container.resolve(AdminAssistantUseCase), requests, saves };
};

const QUESTION: AdminAssistantParams = { prompt: "which products are on sale?", decisions: [] };

const run = async (
    useCase: AdminAssistantUseCase.Interface,
    params: AdminAssistantParams = QUESTION
) => {
    const events = useCase.stream(params);

    const seen: AdminAssistantEvent[] = [];

    // `stream` is a generator, so nothing runs until something pulls.
    for await (const event of events) {
        seen.push(event);
    }

    return seen;
};

describe("AdminAssistantUseCase", () => {
    /*
     * The resolver's tests assert what `resolve()` returns. This asserts the use case actually USES
     * it: reverting `system` to the imported `SYSTEM_PROMPT` would leave every other test green
     * while silently dropping a project's additional instructions.
     */
    it("sends the capability's composed prompt, not the one it imports", async () => {
        const { useCase, requests } = setup();

        await run(useCase);

        expect(requests).toHaveLength(1);
        // Ours first, then the project's: an appended instruction must not cost the tool rules.
        expect(requests[0].system).toContain(SYSTEM_PROMPT);
        expect(requests[0].system).toContain(ADDITIONAL);
        expect(requests[0].system).not.toBe(SYSTEM_PROMPT);
    });

    it("tells the model what the user has on screen, without saving it into the chat", async () => {
        const { useCase, requests, saves } = setup();

        await run(useCase, {
            ...QUESTION,
            pageContext: {
                view: "Entries of the Product content model",
                details: { modelId: "product", visibleFolders: [{ id: "f1", title: "Archive" }] }
            }
        });

        expect(requests[0].system).toContain(SYSTEM_PROMPT);
        expect(requests[0].system).toContain(
            "The user is looking at: Entries of the Product content model."
        );
        expect(requests[0].system).toContain('"title":"Archive"');
        expect(JSON.stringify(saves)).not.toContain("Archive");
    });

    it("keeps the project's instructions after the screen, since they take precedence", async () => {
        const { useCase, requests } = setup();

        await run(useCase, { ...QUESTION, pageContext: { view: "Entries", details: {} } });

        const system = requests[0].system as string;
        expect(system.indexOf("Where the user is")).toBeGreaterThan(-1);
        expect(system.indexOf("Where the user is")).toBeLessThan(system.indexOf(ADDITIONAL));
    });

    it("adds nothing about the screen when the view sent no context", async () => {
        const { useCase, requests } = setup();

        await run(useCase);

        expect(requests[0].system).not.toContain("Where the user is");
    });

    it("finishes the run rather than falling over at the end", async () => {
        const { useCase } = setup();

        const events = await run(useCase);

        expect(events.map(event => event.type)).toEqual(["start", "saved", "done"]);
    });

    it("sends the capability's model and connection", async () => {
        const { useCase, requests } = setup();

        await run(useCase);

        expect(requests[0].model).toBe("anthropic/claude-sonnet-4-5");
        expect(requests[0].connection).toEqual({ sdkName: "anthropic", apiKey: "sk-test" });
    });

    /*
     * The resolver's messages name the setting to fix ("Pick one under Settings → AI Power-Ups →
     * Model roles"). They have to reach the palette, and by the time this is iterating, the
     * transport has committed to a 200, so an event is the only way out.
     */
    it("reports an unresolvable capability as an error event, not a throw", async () => {
        const message = 'No model is configured for the "standard" role.';
        const { useCase, requests } = setup(
            Result.fail(new Error(message)) as Result<never, Error>
        );

        const events = await run(useCase);

        expect(events).toEqual([{ type: "error", message }]);
        expect(requests).toHaveLength(0);
    });

    // The code is what lets the admin show its setup screen instead of a failed answer.
    it("passes the code of a not-configured capability on with the error", async () => {
        const message = 'No model is configured for the "standard" role.';
        const { useCase } = setup(
            Result.fail(new AiCapabilityNotConfiguredError(message)) as Result<never, Error>
        );

        const events = await run(useCase);

        expect(events).toEqual([{ type: "error", message, code: "AI_CAPABILITY_NOT_CONFIGURED" }]);
    });

    it("leaves the code off any other error", async () => {
        const error = Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
        const { useCase } = setup(Result.fail(error) as Result<never, Error>);

        const events = await run(useCase);

        expect(events).toEqual([{ type: "error", message: "socket hang up" }]);
    });

    it("caps the agent loop at the configured step count", async () => {
        const { useCase, requests } = setup();

        await run(useCase);

        expect(requests[0].stopWhen).toBeDefined();
    });

    it("names the model it runs on before anything else", async () => {
        const { useCase } = setup();

        const events = await run(useCase);

        expect(events[0]).toEqual({ type: "start", model: "anthropic/claude-sonnet-4-5" });
    });

    /*
     * The follow-ups tool exists only to carry the model's suggestions to the palette. Showing it as
     * a chip would present it as work done for the user.
     */
    it("turns the follow-ups call into a follow-ups event, with no chip", async () => {
        const { useCase } = setup(undefined, [
            { type: "text-delta", text: "3 products are on sale." },
            {
                type: "tool-call",
                toolName: "suggestFollowUps",
                input: { questions: ["Which of these are low on stock?", "  "] }
            },
            { type: "tool-result", toolName: "suggestFollowUps" }
        ]);

        const events = await run(useCase);

        expect(events.map(event => event.type)).toEqual([
            "start",
            "text",
            "follow-ups",
            "saved",
            "done"
        ]);
        expect(events[2]).toEqual({
            type: "follow-ups",
            questions: ["Which of these are low on stock?"]
        });
    });

    it("drops a follow-ups call whose input is not a list of questions", async () => {
        const { useCase } = setup(undefined, [
            { type: "tool-call", toolName: "suggestFollowUps", input: { questions: "nope" } }
        ]);

        const events = await run(useCase);

        expect(events.map(event => event.type)).toEqual(["start", "saved", "done"]);
    });

    /*
     * Offered next to the project's tools and runnable without approval, since it changes nothing.
     * The loop stops on it, so it costs no step after the answer.
     */
    it("offers the follow-ups tool without approval and stops the loop on it", async () => {
        const { useCase, requests } = setup();

        await run(useCase);

        const request = requests[0] as unknown as {
            activeTools: string[];
            stopWhen: unknown[];
            toolApproval: (params: { toolCall: { toolName: string } }) => string;
        };
        expect(request.activeTools).toContain("suggestFollowUps");
        expect(request.toolApproval({ toolCall: { toolName: "suggestFollowUps" } })).toBe(
            "not-applicable"
        );
        expect(request.stopWhen).toHaveLength(2);
    });

    /*
     * Each step's text arrives with no separator, so the line before a tool call and the answer after
     * it ran together on screen.
     */
    it("starts a new paragraph when text resumes after a tool call", async () => {
        const { useCase } = setup(undefined, [
            { type: "text-delta", text: "I'll look that up." },
            { type: "tool-call", toolName: "listContentModels" },
            { type: "tool-result", toolName: "listContentModels" },
            { type: "text-delta", text: "3 products" },
            { type: "text-delta", text: " are on sale." }
        ]);

        const events = await run(useCase);

        const text = events
            .filter(event => event.type === "text")
            .map(event => (event as { text: string }).text)
            .join("");
        expect(text).toBe("I'll look that up.\n\n3 products are on sale.");
    });

    it("adds no break before the first text, even after a tool call", async () => {
        const { useCase } = setup(undefined, [
            { type: "tool-call", toolName: "listContentModels" },
            { type: "tool-result", toolName: "listContentModels" },
            { type: "text-delta", text: "3 products are on sale." }
        ]);

        const events = await run(useCase);

        expect(events.find(event => event.type === "text")).toEqual({
            type: "text",
            text: "3 products are on sale."
        });
    });

    it("keeps only the first three follow-ups when the model sends more", async () => {
        const { useCase } = setup(undefined, [
            {
                type: "tool-call",
                toolName: "suggestFollowUps",
                input: { questions: ["One?", "Two?", "Three?", "Four?"] }
            }
        ]);

        const events = await run(useCase);

        expect(events.find(event => event.type === "follow-ups")).toEqual({
            type: "follow-ups",
            questions: ["One?", "Two?", "Three?"]
        });
    });

    /*
     * Suggestions made next to a proposed change describe the moment before the user decided. They
     * would still be on screen after the change ran or was rejected.
     */
    it("sends no follow-ups when the run ends waiting for approval", async () => {
        const { useCase } = setup(undefined, [
            {
                type: "tool-approval-request",
                approvalId: "a1",
                toolCall: { toolName: "createFolder", input: { title: "Products" } }
            },
            { type: "tool-call", toolName: "suggestFollowUps", input: { questions: ["Next?"] } }
        ]);

        const events = await run(useCase);

        expect(events.map(event => event.type)).toEqual(["start", "approval", "saved", "done"]);
    });

    it("does not report a rejected follow-ups call as a failed tool", async () => {
        const { useCase } = setup(undefined, [
            { type: "tool-error", toolName: "suggestFollowUps", error: new Error("Invalid input") }
        ]);

        const events = await run(useCase);

        expect(events.map(event => event.type)).toEqual(["start", "saved", "done"]);
    });
});

describe("AdminAssistantUseCase chats", () => {
    const answer: ModelMessage = { role: "assistant", content: [{ type: "text", text: "3." }] };
    const paused: ModelMessage = {
        role: "assistant",
        content: [
            {
                type: "tool-approval-request",
                approvalId: "a1",
                toolCall: { toolName: "createFolder", input: { title: "Products" } }
            }
        ]
    } as unknown as ModelMessage;

    it("sends only the question for a new chat, then saves it as a new chat", async () => {
        const { useCase, requests, saves } = setup(undefined, [], { responseMessages: [answer] });

        const events = await run(useCase);

        expect(requests[0].messages).toEqual([
            { role: "user", content: "which products are on sale?" }
        ]);
        expect(saves).toEqual([
            { messages: [{ role: "user", content: "which products are on sale?" }, answer] }
        ]);
        expect(events.find(event => event.type === "saved")).toMatchObject({
            type: "saved",
            chat: { id: "chat-new", title: "Chat" }
        });
    });

    // The whole point: the request carries the chat id, and the history comes from storage.
    it("continues a saved chat from storage, and saves it under the same id", async () => {
        const earlier: ModelMessage[] = [{ role: "user", content: "How many models?" }, answer];
        const { useCase, requests, saves } = setup(undefined, [], {
            chats: { c1: earlier },
            responseMessages: [answer]
        });

        await run(useCase, { chatId: "c1", prompt: "Which is cheapest?", decisions: [] });

        expect(requests[0].messages).toEqual([
            ...earlier,
            { role: "user", content: "Which is cheapest?" }
        ]);
        expect(saves[0].id).toBe("c1");
        expect(saves[0].messages).toHaveLength(4);
    });

    it("resumes a paused run from storage with the decision", async () => {
        const stored: ModelMessage[] = [{ role: "user", content: "Add a folder" }, paused];
        const { useCase, requests } = setup(undefined, [], { chats: { c1: stored } });

        await run(useCase, {
            chatId: "c1",
            decisions: [{ approvalId: "a1", approved: true }]
        });

        expect(requests[0].messages).toEqual([
            ...stored,
            {
                role: "tool",
                content: [{ type: "tool-approval-response", approvalId: "a1", approved: true }]
            }
        ]);
    });

    /*
     * A request the provider sees with no response is one it refuses, so asking something else
     * while a change waits rejects the change first.
     */
    it("rejects a waiting approval before a new question", async () => {
        const stored: ModelMessage[] = [{ role: "user", content: "Add a folder" }, paused];
        const { useCase, requests } = setup(undefined, [], { chats: { c1: stored } });

        await run(useCase, { chatId: "c1", prompt: "Never mind, list models", decisions: [] });

        expect(requests[0].messages).toEqual([
            ...stored,
            {
                role: "tool",
                content: [
                    {
                        type: "tool-approval-response",
                        approvalId: "a1",
                        approved: false,
                        reason: "The user asked something else instead of deciding."
                    }
                ]
            },
            { role: "user", content: "Never mind, list models" }
        ]);
    });

    it("refuses a decision when nothing in the chat waits for one", async () => {
        const { useCase, requests } = setup(undefined, [], {
            chats: { c1: [{ role: "user", content: "Hi" }, answer] }
        });

        const events = await run(useCase, {
            chatId: "c1",
            decisions: [{ approvalId: "a1", approved: true }]
        });

        expect(events).toEqual([
            { type: "error", message: "Nothing in this chat is waiting for a decision." }
        ]);
        expect(requests).toHaveLength(0);
    });

    // A decision from an older card, or one that leaves a waiting change unanswered.
    it("refuses a decision for a change that is not the one waiting", async () => {
        const stored: ModelMessage[] = [{ role: "user", content: "Add a folder" }, paused];
        const { useCase, requests } = setup(undefined, [], { chats: { c1: stored } });

        const events = await run(useCase, {
            chatId: "c1",
            decisions: [{ approvalId: "a0", approved: true }]
        });

        expect(events).toEqual([
            {
                type: "error",
                message: "This decision is not for the changes waiting in this chat."
            }
        ]);
        expect(requests).toHaveLength(0);
    });

    it("refuses a decision that answers only some of the waiting changes", async () => {
        const two = {
            role: "assistant",
            content: [
                {
                    type: "tool-approval-request",
                    approvalId: "a1",
                    toolCall: { toolName: "createFolder", input: { title: "Products" } }
                },
                {
                    type: "tool-approval-request",
                    approvalId: "a2",
                    toolCall: { toolName: "createFolder", input: { title: "Orders" } }
                }
            ]
        } as unknown as ModelMessage;
        const stored: ModelMessage[] = [{ role: "user", content: "Add two folders" }, two];
        const { useCase, requests } = setup(undefined, [], { chats: { c1: stored } });

        const events = await run(useCase, {
            chatId: "c1",
            decisions: [{ approvalId: "a1", approved: true }]
        });

        expect(events).toEqual([
            {
                type: "error",
                message: "This decision is not for the changes waiting in this chat."
            }
        ]);
        expect(requests).toHaveLength(0);
    });

    it("reports a chat that is not there as an error, without running", async () => {
        const { useCase, requests } = setup();

        const events = await run(useCase, { chatId: "gone", prompt: "Hi", decisions: [] });

        expect(events.map(event => event.type)).toEqual(["error"]);
        expect(requests).toHaveLength(0);
    });

    it("says why a chat could not be saved, then still finishes", async () => {
        const { useCase } = setup(undefined, [], {
            saveError: new AiChatTooLargeError(400_000, 350_000)
        });

        const events = await run(useCase);

        expect(events.map(event => event.type)).toEqual(["start", "not-saved", "done"]);
        expect(events.find(event => event.type === "not-saved")).toMatchObject({
            retryable: false
        });
    });

    it("offers asking again only when the store itself failed", async () => {
        const { useCase } = setup(undefined, [], {
            saveError: new AiChatPersistenceError(new Error("Throttled."))
        });

        const events = await run(useCase);

        expect(events.find(event => event.type === "not-saved")).toMatchObject({
            message: "Throttled.",
            retryable: true
        });
    });

    it("reports a save that throws as not saved, then still finishes", async () => {
        const { useCase } = setup(undefined, [], { saveThrows: new Error("Bug.") });

        const events = await run(useCase);

        expect(events.map(event => event.type)).toEqual(["start", "not-saved", "done"]);
        expect(events.find(event => event.type === "not-saved")).toMatchObject({
            message: "Bug.",
            retryable: false
        });
    });

    it("does not save a run that failed", async () => {
        const { useCase, saves } = setup(undefined, [{ type: "error", error: new Error("Boom") }]);

        await run(useCase);

        expect(saves).toEqual([]);
    });
});
