import { makeAutoObservable } from "mobx";
import { AiChatsGateway } from "./abstractions.js";
import { AiChatsRepository as RepositoryAbstraction } from "./abstractions.js";
import type { AiChat } from "./abstractions.js";
import type { AiChatSummary } from "./abstractions.js";
import type { AiChatsPage } from "./abstractions.js";
import type { SaveAiChatInput } from "./abstractions.js";

const messageOf = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

/**
 * Registered as a singleton, so the assistant and the chats panel see one list.
 *
 * Each mutation after an `await` is its own method, because `makeAutoObservable` makes those
 * actions and a bare assignment after an `await` would have left the one it started in.
 */
class AiChatsRepositoryImpl implements RepositoryAbstraction.Interface {
    chats: AiChatSummary[] = [];
    loading = false;
    error: string | null = null;
    private cursor: string | null = null;

    constructor(private gateway: AiChatsGateway.Interface) {
        makeAutoObservable<AiChatsRepositoryImpl, "gateway">(this, { gateway: false });
    }

    get hasMore(): boolean {
        return this.cursor !== null;
    }

    async load(): Promise<void> {
        await this.read(undefined, true);
    }

    async loadMore(): Promise<void> {
        if (this.cursor === null || this.loading) {
            return;
        }
        await this.read(this.cursor, false);
    }

    get(id: string): Promise<AiChat> {
        return this.gateway.get(id);
    }

    async save(input: SaveAiChatInput): Promise<AiChatSummary> {
        const summary = await this.gateway.save(input);
        this.upsert(summary);
        return summary;
    }

    async delete(id: string): Promise<void> {
        await this.gateway.delete(id);
        this.remove(id);
    }

    private async read(after: string | undefined, replace: boolean): Promise<void> {
        this.startReading();

        try {
            const page = await this.gateway.list(after);
            this.addPage(page, replace);
        } catch (error) {
            this.failReading(messageOf(error));
        }
    }

    private startReading(): void {
        this.loading = true;
        this.error = null;
    }

    private addPage(page: AiChatsPage, replace: boolean): void {
        if (replace) {
            this.chats = page.chats;
        } else {
            // A chat created since the first page shifts the server's pages, so the next can repeat one.
            const known = new Set(this.chats.map(chat => chat.id));
            const fresh = page.chats.filter(chat => !known.has(chat.id));
            this.chats = [...this.chats, ...fresh];
        }
        this.cursor = page.cursor;
        this.loading = false;
    }

    private failReading(message: string): void {
        this.error = message;
        this.loading = false;
    }

    /*
     * The server lists chats by when they were created, so a chat saved again keeps its place. Only
     * a new chat goes first, which is also where the server puts it.
     */
    private upsert(summary: AiChatSummary): void {
        const known = this.chats.some(chat => chat.id === summary.id);
        if (!known) {
            this.chats = [summary, ...this.chats];
            return;
        }
        this.chats = this.chats.map(chat => (chat.id === summary.id ? summary : chat));
    }

    private remove(id: string): void {
        this.chats = this.chats.filter(chat => chat.id !== id);
    }
}

export const AiChatsRepository = RepositoryAbstraction.createImplementation({
    implementation: AiChatsRepositoryImpl,
    dependencies: [AiChatsGateway]
});
