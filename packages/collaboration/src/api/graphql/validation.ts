import zod from "zod";
import { MAX_MENTION_ID_LENGTH, MAX_MENTIONS } from "~/shared/constants.js";

const threadType = zod.enum(["note", "task"]);

// Security: mentions fan out notifications, so they are bounded.
const mentions = zod
    .array(zod.string().min(1).max(MAX_MENTION_ID_LENGTH))
    .max(MAX_MENTIONS, `You can mention at most ${MAX_MENTIONS} users.`)
    .optional();

export const createCollabThreadValidation = zod.object({
    input: zod.object({
        contentType: zod.string().min(1, "Content type is required."),
        contentId: zod.string().min(1, "Content ID is required."),
        // Empty string = entry-level (unanchored) comment.
        locator: zod.string(),
        type: threadType,
        body: zod.string().min(1, "Message body is required."),
        mentions,
        assigneeId: zod.string().nullish(),
        dueDate: zod.string().nullish()
    })
});

export const listCollabThreadsValidation = zod.object({
    where: zod.object({
        contentType: zod.string().min(1, "Content type is required."),
        contentId: zod.string().min(1, "Content ID is required."),
        type: threadType.optional(),
        resolved: zod.boolean().optional()
    }),
    limit: zod.number().int().min(1).max(100).optional(),
    after: zod.string().nullish(),
    sort: zod.array(zod.string()).optional()
});

export const getCollabThreadValidation = zod.object({
    id: zod.string().min(1, "ID is required.")
});

export const idOnlyValidation = zod.object({
    id: zod.string().min(1, "ID is required.")
});

export const replyToCollabThreadValidation = zod.object({
    threadId: zod.string().min(1, "Thread ID is required."),
    body: zod.string().min(1, "Reply body is required."),
    mentions
});

export const updateCollabMessageValidation = zod.object({
    threadId: zod.string().min(1, "Thread ID is required."),
    messageId: zod.string().min(1, "Message ID is required."),
    body: zod.string().min(1, "Message body is required.")
});

export const deleteCollabMessageValidation = zod.object({
    threadId: zod.string().min(1, "Thread ID is required."),
    messageId: zod.string().min(1, "Message ID is required.")
});
