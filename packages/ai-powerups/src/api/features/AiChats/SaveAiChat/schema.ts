import zod from "zod";

/*
 * Only the shape the store relies on is checked. The messages are the assistant's own, replayed
 * verbatim, and the assistant validates them when a chat is continued.
 */
const message = zod
    .object({
        role: zod.enum(["system", "user", "assistant", "tool"]),
        content: zod.unknown()
    })
    .passthrough();

export const saveAiChatValidation = zod.object({
    id: zod.string().optional(),
    title: zod.string().trim().min(1).max(200).optional(),
    messages: zod.array(message).min(1).max(1000)
});
