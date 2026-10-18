import { describe, expect, it } from "vitest";
import {
    MAIL_BCC_CHUNK_SIZE,
    NOTIFICATION_COMMENT_MAX_LENGTH,
    NOTIFICATION_SEND_CONCURRENCY,
    WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION,
    WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION
} from "~/domain/notifications/constants.js";

describe("notification constants (R187, R189a, R193, R197)", () => {
    it("holds the values the contract names", () => {
        expect(WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION).toBe("workflows.notification");
        expect(WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION).toBe("workflows.reviewChanged");
        expect(NOTIFICATION_SEND_CONCURRENCY).toBe(10);
        expect(NOTIFICATION_COMMENT_MAX_LENGTH).toBe(300);
        expect(MAIL_BCC_CHUNK_SIZE).toBe(50);
    });
});
