import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { turnsFromMessages } from "~/features/adminAssistant/turnsFromMessages.js";
import type { AdminAssistantMessage } from "~/features/adminAssistant/abstractions";

describe("turnsFromMessages", () => {
    it("starts a turn at every user message", () => {
        const turns = turnsFromMessages([
            { role: "user", content: "Which products are on sale?" },
            { role: "assistant", content: "3 products." },
            { role: "user", content: [{ type: "text", text: "Which is cheapest?" }] },
            { role: "assistant", content: [{ type: "text", text: "The mug." }] }
        ]);

        expect(turns.map(turn => [turn.question, turn.text])).toEqual([
            ["Which products are on sale?", "3 products."],
            ["Which is cheapest?", "The mug."]
        ]);
        expect(turns.every(turn => turn.settled && !turn.running)).toBe(true);
    });

    it("reads the tools a turn called, and which of them failed", () => {
        const [turn] = turnsFromMessages([
            { role: "user", content: "What models are there?" },
            {
                role: "assistant",
                content: [
                    { type: "text", text: "I'll check the models." },
                    {
                        type: "tool-call",
                        toolCallId: "1",
                        toolName: "listContentModels",
                        input: {}
                    },
                    { type: "tool-call", toolCallId: "2", toolName: "listFolders", input: {} }
                ]
            },
            {
                role: "tool",
                content: [
                    {
                        type: "tool-result",
                        toolCallId: "1",
                        toolName: "listContentModels",
                        output: { type: "json", value: [] }
                    },
                    {
                        type: "tool-result",
                        toolCallId: "2",
                        toolName: "listFolders",
                        output: { type: "error-text", value: "Not allowed." }
                    }
                ]
            },
            { role: "assistant", content: [{ type: "text", text: "6 content models." }] }
        ]);

        expect(turn.tools).toEqual(["listContentModels", "listFolders"]);
        expect(turn.completed).toEqual(["listContentModels"]);
        expect(turn.failed).toEqual(["listFolders"]);
        expect(turn.text).toBe("I'll check the models.\n\n6 content models.");
        expect(turn.text.slice(turn.answerStart).trim()).toBe("6 content models.");
    });

    it("keeps each turn's messages verbatim, so the chat replays as it was saved", () => {
        const messages: AdminAssistantMessage[] = [
            { role: "user", content: "Hi" },
            {
                role: "assistant",
                content: [
                    { type: "reasoning", text: "…" },
                    { type: "text", text: "Hello." }
                ]
            }
        ];

        const [turn] = turnsFromMessages(messages);

        expect(turn.messages).toEqual([messages[1]]);
    });

    /*
     * The assistant hands over its follow-up questions through a tool call. It is how the answer
     * ends, not work the user asked for, so it is no tool chip, but its questions come back.
     */
    it("reads follow-ups from the call that suggested them, and does not list it as a tool", () => {
        const [turn] = turnsFromMessages([
            { role: "user", content: "What models are there?" },
            {
                role: "assistant",
                content: [
                    { type: "text", text: "6 content models." },
                    {
                        type: "tool-call",
                        toolCallId: "1",
                        toolName: "suggestFollowUps",
                        input: { questions: ["What fields does Product have?", " "] }
                    }
                ]
            },
            {
                role: "tool",
                content: [
                    {
                        type: "tool-result",
                        toolCallId: "1",
                        toolName: "suggestFollowUps",
                        output: { type: "text", value: "Shown to the user." }
                    }
                ]
            }
        ]);

        expect(turn.tools).toEqual([]);
        expect(turn.completed).toEqual([]);
        expect(turn.followUps).toEqual(["What fields does Product have?"]);
        expect(turn.answerStart).toBe(0);
    });

    it("ignores messages before the first question", () => {
        const turns = turnsFromMessages([
            { role: "assistant", content: "Stray." },
            { role: "user", content: "Hi" }
        ]);

        expect(turns).toHaveLength(1);
        expect(turns[0].text).toBe("");
    });
});
