import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { parseChatBody } from "~/api/features/AdminAssistant/parseChatBody.js";

const view = "Entries of the Product content model";

describe("parseChatBody page context", () => {
    it("keeps the page context sent with a question", () => {
        const params = parseChatBody({
            prompt: "list the entries",
            pageContext: { view, details: { modelId: "product" } }
        });

        expect(params?.pageContext).toEqual({ view, details: { modelId: "product" } });
    });

    it("ignores a page context sent with a decision, which asks nothing new", () => {
        const params = parseChatBody({
            chatId: "chat-1",
            approvals: [{ approvalId: "a1", approved: true }],
            pageContext: { view, details: {} }
        });

        expect(params?.pageContext).toBeUndefined();
    });

    it("drops a context with no view, and still takes the question", () => {
        const params = parseChatBody({
            prompt: "list the entries",
            pageContext: { details: { modelId: "product" } }
        });

        expect(params?.prompt).toBe("list the entries");
        expect(params?.pageContext).toBeUndefined();
    });

    it("keeps the view but drops details too big to be ids and titles", () => {
        const params = parseChatBody({
            prompt: "list the entries",
            pageContext: { view, details: { body: "x".repeat(9000) } }
        });

        expect(params?.pageContext).toEqual({ view, details: {} });
    });
});

describe("parseChatBody client tools", () => {
    const tool = { name: "addPageElements", description: "Adds.", inputSchema: { type: "object" } };

    it("takes results for a paused run as a request of their own", () => {
        const params = parseChatBody({
            chatId: "chat-1",
            toolResults: [{ toolCallId: "c1", toolName: "addPageElements", output: { added: 1 } }],
            clientTools: [tool],
            pageContext: { view, details: {} }
        });

        expect(params?.toolResults).toEqual([
            { toolCallId: "c1", toolName: "addPageElements", output: { added: 1 } }
        ]);
        expect(params?.clientTools).toEqual([tool]);
        // Results come from the screen that ran them, so it still describes itself.
        expect(params?.pageContext).toEqual({ view, details: {} });
    });

    it("refuses results without the chat they continue", () => {
        const params = parseChatBody({
            toolResults: [{ toolCallId: "c1", toolName: "addPageElements", output: {} }]
        });

        expect(params).toBeNull();
    });

    it("drops tools with a bad name or a schema that is not an object", () => {
        const params = parseChatBody({
            prompt: "add a hero",
            clientTools: [
                tool,
                { ...tool, name: "has space" },
                { ...tool, name: "other", inputSchema: { type: "string" } },
                { ...tool }
            ]
        });

        expect(params?.clientTools).toEqual([tool]);
    });

    it("drops a set of tools too large to send", () => {
        const params = parseChatBody({
            prompt: "add a hero",
            clientTools: [{ ...tool, description: "x".repeat(70_000) }]
        });

        expect(params?.clientTools).toEqual([]);
    });
});
