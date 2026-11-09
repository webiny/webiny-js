import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { AiChatsGateway } from "~/features/aiChats/abstractions";
import { AiChatsRepository as RepositoryAbstraction } from "~/features/aiChats/abstractions";
import type { AiChatSummary } from "~/features/aiChats/abstractions";
import type { AiChatsPage } from "~/features/aiChats/abstractions";
import { AiChatsRepository } from "~/features/aiChats/AiChatsRepository.js";

const summary = (id: string): AiChatSummary => ({
    id,
    title: `Chat ${id}`,
    createdOn: "2026-10-19T10:00:00.000Z",
    savedOn: "2026-10-19T10:00:00.000Z"
});

/** A gateway that answers `list` from the given pages, keyed by the cursor that reads them. */
const setup = (pages: Record<string, AiChatsPage>) => {
    const container = new Container();
    const deleted: string[] = [];

    const gateway: AiChatsGateway.Interface = {
        async list(after) {
            const page = pages[after ?? "first"];
            if (!page) {
                throw new Error("Listing failed.");
            }
            return page;
        },
        async get() {
            throw new Error("Not used.");
        },
        async save(input) {
            return summary(input.id ?? "new");
        },
        async delete(id) {
            deleted.push(id);
        }
    };

    container.registerInstance(AiChatsGateway, gateway);
    container.register(AiChatsRepository);

    return { repository: container.resolve(RepositoryAbstraction), deleted };
};

describe("AiChatsRepository", () => {
    it("reads the first page, then the next one", async () => {
        const { repository } = setup({
            first: { chats: [summary("1"), summary("2")], cursor: "page-2" },
            "page-2": { chats: [summary("3")], cursor: null }
        });

        await repository.load();
        expect(repository.chats.map(chat => chat.id)).toEqual(["1", "2"]);
        expect(repository.hasMore).toBe(true);

        await repository.loadMore();
        expect(repository.chats.map(chat => chat.id)).toEqual(["1", "2", "3"]);
        expect(repository.hasMore).toBe(false);
    });

    it("leaves out a chat the next page repeats", async () => {
        const { repository } = setup({
            first: { chats: [summary("1")], cursor: "page-2" },
            "page-2": { chats: [summary("1"), summary("2")], cursor: null }
        });

        await repository.load();
        await repository.loadMore();

        expect(repository.chats.map(chat => chat.id)).toEqual(["1", "2"]);
    });

    it("keeps a chat saved again in its place, as the server lists it", async () => {
        const { repository } = setup({
            first: { chats: [summary("1"), summary("2")], cursor: null }
        });
        await repository.load();

        await repository.save({ id: "2", messages: [{ role: "user", content: "Hi" }] });

        expect(repository.chats.map(chat => chat.id)).toEqual(["1", "2"]);
    });

    it("puts a new chat first", async () => {
        const { repository } = setup({
            first: { chats: [summary("1")], cursor: null }
        });
        await repository.load();

        await repository.save({ messages: [{ role: "user", content: "Hi" }] });

        expect(repository.chats.map(chat => chat.id)).toEqual(["new", "1"]);
    });

    it("drops a deleted chat", async () => {
        const { repository, deleted } = setup({
            first: { chats: [summary("1"), summary("2")], cursor: null }
        });
        await repository.load();

        await repository.delete("1");

        expect(deleted).toEqual(["1"]);
        expect(repository.chats.map(chat => chat.id)).toEqual(["2"]);
    });

    it("says why a read failed", async () => {
        const { repository } = setup({});

        await repository.load();

        expect(repository.error).toBe("Listing failed.");
        expect(repository.loading).toBe(false);
    });
    it("drops a read that a newer one replaced", async () => {
        const container = new Container();
        // The first `list` call fails, but only after the second one has already answered.
        let failFirst: (error: Error) => void = () => undefined;
        let calls = 0;
        const gateway: AiChatsGateway.Interface = {
            list() {
                calls++;
                if (calls === 1) {
                    return new Promise<AiChatsPage>((_, reject) => {
                        failFirst = reject;
                    });
                }
                return Promise.resolve({ chats: [summary("1")], cursor: null });
            },
            async get() {
                throw new Error("Not used.");
            },
            async save(input) {
                return summary(input.id ?? "new");
            },
            async delete() {}
        };
        container.registerInstance(AiChatsGateway, gateway);
        container.register(AiChatsRepository);
        const repository = container.resolve(RepositoryAbstraction);

        const older = repository.load();
        await repository.load();
        failFirst(new Error("Listing failed."));
        await older;

        expect(repository.chats.map(chat => chat.id)).toEqual(["1"]);
        expect(repository.error).toBeNull();
        expect(repository.loading).toBe(false);
    });
});
