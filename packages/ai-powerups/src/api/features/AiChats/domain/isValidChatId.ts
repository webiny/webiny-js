const CHAT_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Ids go into key-value keys, so only a short id without separators is accepted from a client. */
export const isValidChatId = (id: unknown): id is string => {
    return typeof id === "string" && CHAT_ID.test(id);
};
