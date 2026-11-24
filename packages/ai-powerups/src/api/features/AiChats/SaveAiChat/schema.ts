import zod from "zod";

/*
 * Only the shape the store relies on is checked. The assistant is the only caller, and it saves the
 * messages the model produced as they are.
 */
const message = zod
    .object({
        role: zod.enum(["system", "user", "assistant", "tool"]),
        content: zod.unknown()
    })
    .passthrough();

export const saveAiChatValidation = zod.object({
    id: zod.string().optional(),
    messages: zod.array(message).min(1).max(1000, "A chat holds at most 1000 messages.")
});
