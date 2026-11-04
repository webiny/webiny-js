import zod from "zod";

const threadType = zod.enum(["note", "task"]);

export const createCollabThreadValidation = zod.object({
    input: zod.object({
        contentType: zod.string().min(1, "Content type is required."),
        contentId: zod.string().min(1, "Content ID is required."),
        // Empty string = entry-level (unanchored) comment.
        locator: zod.string(),
        type: threadType,
        body: zod.string().min(1, "Message body is required."),
        mentions: zod.array(zod.string()).optional(),
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
    limit: zod.number().optional(),
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
    mentions: zod.array(zod.string()).optional()
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
