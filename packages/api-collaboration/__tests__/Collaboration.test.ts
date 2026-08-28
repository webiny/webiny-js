import { describe, expect, it } from "vitest";
import { createGraphQLHandler, TEST_CONTENT_TYPE } from "~tests/__helpers/handler.js";

const CONTENT_ID = "articleModel:entry-123";

describe("collaboration threads (graphql)", () => {
    const handler = createGraphQLHandler();

    it("runs the full thread lifecycle: create, list, get, reply, resolve, reopen, edit, delete", async () => {
        // 1. Create a thread with its first message.
        const [createResponse] = await handler.createCollabThread({
            input: {
                contentType: TEST_CONTENT_TYPE,
                contentId: CONTENT_ID,
                locator: "title",
                type: "note",
                body: "Should this be the SEO title?",
                mentions: ["user-marko"]
            }
        });

        const created = createResponse.data.collaboration.createCollabThread;
        expect(created.error).toBeNull();
        expect(created.data).toMatchObject({
            contentType: TEST_CONTENT_TYPE,
            contentId: CONTENT_ID,
            locator: "title",
            type: "note",
            resolved: false,
            anchor: { exists: true, authorized: true, label: "Test Field", path: ["Tab 1"] }
        });
        expect(created.data.messages).toHaveLength(1);
        expect(created.data.messages[0]).toMatchObject({
            body: "Should this be the SEO title?",
            mentions: ["user-marko"]
        });
        expect(created.data.createdBy.id).toBeTruthy();

        const threadId = created.data.id;
        const firstMessageId = created.data.messages[0].id;

        // 2. List threads for the content target.
        const [listResponse] = await handler.listCollabThreads({
            where: { contentType: TEST_CONTENT_TYPE, contentId: CONTENT_ID }
        });
        const list = listResponse.data.collaboration.listCollabThreads;
        expect(list.error).toBeNull();
        expect(list.data).toHaveLength(1);
        expect(list.data[0].id).toBe(threadId);
        expect(list.meta.totalCount).toBe(1);

        // 3. Get the single thread.
        const [getResponse] = await handler.getCollabThread({ id: threadId });
        expect(getResponse.data.collaboration.getCollabThread.data.id).toBe(threadId);

        // 4. Reply, then confirm two messages.
        const [replyResponse] = await handler.replyToCollabThread({
            threadId,
            body: "Display title. SEO title lives in Tab 2."
        });
        expect(replyResponse.data.collaboration.replyToCollabThread.error).toBeNull();
        const replyId = replyResponse.data.collaboration.replyToCollabThread.data.id;
        expect(replyId).toBeTruthy();

        const [afterReply] = await handler.getCollabThread({ id: threadId });
        expect(afterReply.data.collaboration.getCollabThread.data.messages).toHaveLength(2);

        // 5. Resolve — records resolvedBy.
        const [resolveResponse] = await handler.resolveCollabThread({ id: threadId });
        const resolved = resolveResponse.data.collaboration.resolveCollabThread.data;
        expect(resolved.resolved).toBe(true);
        expect(resolved.resolvedBy.id).toBeTruthy();
        expect(resolved.resolvedOn).toBeTruthy();

        // 6. Reopen — clears resolution.
        const [reopenResponse] = await handler.reopenCollabThread({ id: threadId });
        const reopened = reopenResponse.data.collaboration.reopenCollabThread.data;
        expect(reopened.resolved).toBe(false);
        expect(reopened.resolvedBy).toBeNull();

        // 7. Edit the first message.
        const [editResponse] = await handler.updateCollabMessage({
            threadId,
            messageId: firstMessageId,
            body: "Edited: which title convention are we using?"
        });
        expect(editResponse.data.collaboration.updateCollabMessage.data.body).toBe(
            "Edited: which title convention are we using?"
        );

        // 8. Soft-delete the reply.
        const [deleteMessageResponse] = await handler.deleteCollabMessage({
            threadId,
            messageId: replyId
        });
        expect(deleteMessageResponse.data.collaboration.deleteCollabMessage.data).toBe(true);

        const [afterMessageDelete] = await handler.getCollabThread({ id: threadId });
        const deletedMessage =
            afterMessageDelete.data.collaboration.getCollabThread.data.messages.find(
                (message: { id: string }) => message.id === replyId
            );
        expect(deletedMessage.deleted).toBe(true);

        // 9. Soft-delete the thread; it disappears from reads.
        const [deleteThreadResponse] = await handler.deleteCollabThread({ id: threadId });
        expect(deleteThreadResponse.data.collaboration.deleteCollabThread.data).toBe(true);

        const [afterThreadDelete] = await handler.getCollabThread({ id: threadId });
        expect(afterThreadDelete.data.collaboration.getCollabThread.data).toBeNull();
        expect(afterThreadDelete.data.collaboration.getCollabThread.error).not.toBeNull();

        const [listAfterDelete] = await handler.listCollabThreads({
            where: { contentType: TEST_CONTENT_TYPE, contentId: CONTENT_ID }
        });
        expect(listAfterDelete.data.collaboration.listCollabThreads.data).toHaveLength(0);
    });

    it("denies creating a thread when no resolver owns the content type", async () => {
        const [response] = await handler.createCollabThread({
            input: {
                contentType: "unknown.type",
                contentId: "x:y",
                locator: "title",
                type: "note",
                body: "Nobody can resolve this anchor."
            }
        });

        const result = response.data.collaboration.createCollabThread;
        expect(result.data).toBeNull();
        expect(result.error).not.toBeNull();
        expect(result.error.code).toBe("Collaboration/Thread/NotAuthorized");
    });
});
