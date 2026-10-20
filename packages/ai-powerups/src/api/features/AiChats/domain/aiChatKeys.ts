/*
 * Each chat is two key-value records. The summary is small and joins the owner's collection, so
 * listing chats reads summaries only. The messages can be long and sit outside every collection,
 * read only when one chat is opened.
 *
 * The key-value store already scopes keys by tenant, and every key here includes the owner, so one
 * identity can never reach another's chats.
 */
export const aiChatKeys = {
    collection(ownerId: string): string {
        return `aiChats:${ownerId}`;
    },
    summary(ownerId: string, chatId: string): string {
        return `aiChat:${ownerId}:${chatId}`;
    },
    messages(ownerId: string, chatId: string): string {
        return `aiChatMessages:${ownerId}:${chatId}`;
    }
};
