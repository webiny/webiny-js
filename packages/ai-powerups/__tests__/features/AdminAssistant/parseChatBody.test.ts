import { describe, it, expect } from "vitest";
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
            pageContext: { view, details: { body: "x".repeat(5000) } }
        });

        expect(params?.pageContext).toEqual({ view, details: {} });
    });
});
