import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { Container } from "@webiny/di";
import type { ModelMessage } from "ai";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { KeyValueStoreFeature } from "@webiny/api-core/features/keyValueStore/feature.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { AiChatsRepositoryFeature } from "~/api/features/AiChats/shared/index.js";
import { ListAiChatsFeature } from "~/api/features/AiChats/ListAiChats/index.js";
import { ListAiChatsUseCase } from "~/api/features/AiChats/ListAiChats/index.js";
import { GetAiChatFeature } from "~/api/features/AiChats/GetAiChat/index.js";
import { GetAiChatUseCase } from "~/api/features/AiChats/GetAiChat/index.js";
import { SaveAiChatFeature } from "~/api/features/AiChats/SaveAiChat/index.js";
import { SaveAiChatUseCase } from "~/api/features/AiChats/SaveAiChat/index.js";
import { DeleteAiChatFeature } from "~/api/features/AiChats/DeleteAiChat/index.js";
import { DeleteAiChatUseCase } from "~/api/features/AiChats/DeleteAiChat/index.js";

const question = (text: string): ModelMessage[] => [
    { role: "user", content: text },
    { role: "assistant", content: [{ type: "text", text: `About ${text}` }] }
];

/** Real key-value store on the configured storage, a fixed tenant, and an identity to switch. */
const setup = (identityId: string | null = "user-1") => {
    const container = new Container();
    const { keyValueStorageOperations } =
        getStorageOps<ApiCoreStorageOperations>("apiCore").storageOperations;

    container.registerInstance(TenantContext, {
        getTenant: () => ({ id: "root" })
    } as unknown as TenantContext.Interface);

    let current = identityId;
    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ id: current, isAnonymous: () => current === null })
    } as unknown as IdentityContext.Interface);

    KeyValueStoreFeature.register(container, keyValueStorageOperations);
    CompressionFeature.register(container);
    AiChatsRepositoryFeature.register(container);
    ListAiChatsFeature.register(container);
    GetAiChatFeature.register(container);
    SaveAiChatFeature.register(container);
    DeleteAiChatFeature.register(container);

    return {
        list: container.resolve(ListAiChatsUseCase),
        get: container.resolve(GetAiChatUseCase),
        save: container.resolve(SaveAiChatUseCase),
        remove: container.resolve(DeleteAiChatUseCase),
        keyValueStore: container.resolve(KeyValueStore),
        signInAs: (id: string | null) => {
            current = id;
        }
    };
};

describe("AI chats", () => {
    it("lists no chats before the first save", async () => {
        const { list } = setup();

        const result = await list.execute({});
        expect(result.value).toEqual({ items: [], cursor: null });
    });

    it("creates a chat titled with its first question, and reopens it with its messages", async () => {
        const { save, get, list } = setup();
        const messages = question("Which models have a slug field?");

        const saved = await save.execute({ messages });
        expect(saved.isOk()).toBe(true);
        expect(saved.value).toMatchObject({
            id: expect.stringMatching(/^[a-f0-9]{24}$/),
            title: "Which models have a slug field?",
            messages
        });
        expect(saved.value.createdOn).toBe(saved.value.savedOn);

        const opened = await get.execute(saved.value.id);
        expect(opened.value).toEqual(saved.value);

        const listed = await list.execute({});
        const { messages: _, ...summary } = saved.value;
        expect(listed.value.items).toEqual([summary]);
    });

    it("stores the messages gzipped, beside the summary", async () => {
        const { save, keyValueStore } = setup();

        const saved = await save.execute({ messages: question("Compress me") });
        const stored = await keyValueStore.get<{ compression: string }>(
            `aiChatMessages:user-1:${saved.value.id}`
        );
        expect(stored.value.compression).toBe("gzip");
    });

    it("overwrites a chat, keeping its title and creation time", async () => {
        const { save, get } = setup();
        const first = await save.execute({ messages: question("First question") });

        const longer = [...first.value.messages, ...question("Follow-up")];
        const updated = await save.execute({ id: first.value.id, messages: longer });

        expect(updated.value).toMatchObject({
            id: first.value.id,
            title: "First question",
            createdOn: first.value.createdOn,
            messages: longer
        });
        expect((await get.execute(first.value.id)).value.messages).toEqual(longer);
    });

    it("takes a title from the save when one is given", async () => {
        const { save } = setup();
        const created = await save.execute({ title: "  Slugs  ", messages: question("Hi") });
        expect(created.value.title).toBe("Slugs");

        const renamed = await save.execute({
            id: created.value.id,
            title: "Renamed",
            messages: created.value.messages
        });
        expect(renamed.value.title).toBe("Renamed");
    });

    it("shortens a long first question to fit the chats panel", async () => {
        const { save } = setup();
        const long = "word ".repeat(40);

        const saved = await save.execute({ messages: question(long) });
        expect(saved.value.title).toHaveLength(80);
        expect(saved.value.title.endsWith("…")).toBe(true);
    });

    it("saves a chat whose first question has content it cannot read as text", async () => {
        const { save } = setup();
        const messages = [
            { role: "user", content: { unexpected: true } },
            { role: "assistant", content: "Still saved." }
        ] as unknown as ModelMessage[];

        const saved = await save.execute({ messages });
        expect(saved.isOk()).toBe(true);
        expect(saved.value.title).toBe("Untitled chat");
    });

    it("lists the newest chat first, a page at a time", async () => {
        const { save, list } = setup();
        const ids: string[] = [];
        for (const text of ["one", "two", "three"]) {
            const saved = await save.execute({ messages: question(text) });
            ids.push(saved.value.id);
        }

        const first = await list.execute({ limit: 2 });
        expect(first.value.items.map(chat => chat.id)).toEqual([ids[2], ids[1]]);
        expect(first.value.cursor).toEqual(expect.any(String));

        const second = await list.execute({ limit: 2, after: first.value.cursor! });
        expect(second.value.items.map(chat => chat.id)).toEqual([ids[0]]);
        expect(second.value.cursor).toBeNull();
    });

    it("keeps each identity's chats to itself", async () => {
        const { save, list, get, remove, signInAs } = setup();
        const mine = await save.execute({ messages: question("Mine") });

        signInAs("user-2");
        expect((await list.execute({})).value.items).toEqual([]);
        expect((await get.execute(mine.value.id)).error?.code).toBe("AiChat/NotFound");
        expect((await remove.execute(mine.value.id)).error?.code).toBe("AiChat/NotFound");

        const overwrite = await save.execute({ id: mine.value.id, messages: question("Theirs") });
        expect(overwrite.error?.code).toBe("AiChat/NotFound");

        signInAs("user-1");
        expect((await get.execute(mine.value.id)).value.title).toBe("Mine");
    });

    it("deletes a chat from the list and from storage", async () => {
        const { save, list, get, remove } = setup();
        const saved = await save.execute({ messages: question("Delete me") });

        expect((await remove.execute(saved.value.id)).isOk()).toBe(true);
        expect((await list.execute({})).value.items).toEqual([]);
        expect((await get.execute(saved.value.id)).error?.code).toBe("AiChat/NotFound");
        expect((await remove.execute(saved.value.id)).error?.code).toBe("AiChat/NotFound");
    });

    it("refuses to save over an id that does not exist", async () => {
        const { save } = setup();

        const result = await save.execute({
            id: "000000000000000000000000",
            messages: question("x")
        });
        expect(result.error?.code).toBe("AiChat/NotFound");
    });

    it("refuses an id that could not have been saved", async () => {
        const { get } = setup();

        expect((await get.execute("a:b")).error?.code).toBe("AiChat/NotFound");
    });

    it("refuses a chat with no messages", async () => {
        const { save } = setup();

        const result = await save.execute({ messages: [] });
        expect(result.error?.code).toBe("AiChat/Validation");
    });

    it("refuses a limit outside 1 to 100", async () => {
        const { list } = setup();

        expect((await list.execute({ limit: 0 })).error?.code).toBe("AiChat/Validation");
        expect((await list.execute({ limit: 101 })).error?.code).toBe("AiChat/Validation");
    });

    it("refuses a cursor it did not return", async () => {
        const { list } = setup();

        const result = await list.execute({ after: "not-a-cursor" });
        expect(result.error?.code).toBe("AiChat/Validation");
    });

    it("refuses a chat still too large once compressed", async () => {
        const { save, list } = setup();
        // Random bytes do not compress, so this stays over the limit after gzip.
        const noise = randomBytes(300_000).toString("base64");

        const result = await save.execute({ messages: question(noise) });
        expect(result.error?.code).toBe("AiChat/TooLarge");
        expect((await list.execute({})).value.items).toEqual([]);
    });

    it("has no chats for an anonymous identity", async () => {
        const { list, save } = setup(null);

        expect((await list.execute({})).error?.code).toBe("AiChat/NotAuthenticated");
        expect((await save.execute({ messages: question("x") })).error?.code).toBe(
            "AiChat/NotAuthenticated"
        );
    });
});
