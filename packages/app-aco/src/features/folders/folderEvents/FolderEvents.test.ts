import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import {
    EventPublisher,
    EventPublisherFeature
} from "@webiny/app/features/eventPublisher/index.js";
import { EnvConfig } from "@webiny/app/features/envConfig/index.js";
import { WebsocketEvent } from "@webiny/app-websockets/events/WebsocketEvent.js";
import { GetFolderGateway } from "~/features/folders/getFolder/abstractions.js";
import { folderCacheFactory } from "~/features/folders/cache/index.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import type { FolderPermission } from "~/types.js";
import { Folder } from "~/domain/folder/Folder.js";
import { AddCreatedFolderToCache } from "./AddCreatedFolderToCache.js";
import { RefreshUpdatedFolderInCache } from "./RefreshUpdatedFolderInCache.js";
import { RemoveDeletedFolderFromCache } from "./RemoveDeletedFolderFromCache.js";
import { FolderWebsocketMessages } from "./FolderWebsocketMessages.js";

const folderDto = (overrides: Partial<FolderDto> = {}) =>
    ({
        id: "folder-1",
        title: "Drafts",
        slug: "drafts",
        path: "drafts",
        type: "FmFile",
        parentId: null,
        permissions: [],
        ...overrides
    }) as FolderDto;

/*
 * Real publisher and handlers, fake server. The websocket bridge publishes `WebsocketEvent`s through
 * the same publisher, so publishing one here is what an incoming message does at runtime.
 */
const setup = (folder: FolderDto) => {
    const fetched: string[] = [];
    const container = new Container();

    // The publisher reads `debug` from here to decide whether to log.
    container.registerInstance(EnvConfig, {
        get: () => undefined
    } as unknown as EnvConfig.Interface);
    EventPublisherFeature.register(container);
    container.registerInstance(GetFolderGateway, {
        execute: async (id: string) => {
            fetched.push(id);
            return folder;
        }
    });
    container.register(AddCreatedFolderToCache);
    container.register(RefreshUpdatedFolderInCache);
    container.register(RemoveDeletedFolderFromCache);
    container.register(FolderWebsocketMessages);

    const receive = (payload: { action: string; data: unknown }) =>
        container.resolve(EventPublisher).publish(new WebsocketEvent(payload));

    return { receive, fetched };
};

describe("folder events", () => {
    beforeEach(() => {
        folderCacheFactory.getCache("FmFile").clear();
        folderCacheFactory.getCache("cms:article").clear();
    });

    it("adds a folder created on the server to the cache for its type", async () => {
        const { receive, fetched } = setup(folderDto());

        await receive({ action: "aco.folder.created", data: { id: "folder-1" } });

        expect(fetched).toEqual(["folder-1"]);
        expect(folderCacheFactory.getCache("FmFile").getItem(f => f.id === "folder-1")?.title).toBe(
            "Drafts"
        );
    });

    it("files the folder under its own type, not the one on screen", async () => {
        const { receive } = setup(folderDto({ type: "cms:article" }));

        await receive({ action: "aco.folder.created", data: { id: "folder-1" } });

        expect(folderCacheFactory.getCache("FmFile").hasItems()).toBe(false);
        expect(folderCacheFactory.getCache("cms:article").count()).toBe(1);
    });

    it("keeps one copy when the same folder arrives twice", async () => {
        const { receive } = setup(folderDto());

        await receive({ action: "aco.folder.created", data: { id: "folder-1" } });
        await receive({ action: "aco.folder.created", data: { id: "folder-1" } });

        expect(folderCacheFactory.getCache("FmFile").count()).toBe(1);
    });

    it("ignores messages that are not about folders", async () => {
        const { receive, fetched } = setup(folderDto());

        await receive({ action: "fm.file.enrichment", data: { id: "file-1" } });

        expect(fetched).toEqual([]);
        expect(folderCacheFactory.getCache("FmFile").hasItems()).toBe(false);
    });

    describe("updates", () => {
        const viewer: FolderPermission = { target: "admin:1", level: "viewer" };
        const cache = () => folderCacheFactory.getCache("FmFile");
        const child = () => cache().getItem(f => f.id === "child-1");

        const seed = (
            parentPermissions: FolderDto["permissions"],
            childPermissions: FolderDto["permissions"]
        ) => {
            cache().addItems([
                Folder.create(folderDto({ permissions: parentPermissions })),
                Folder.create(
                    folderDto({
                        id: "child-1",
                        slug: "child",
                        path: "drafts/child",
                        parentId: "folder-1",
                        permissions: childPermissions
                    })
                )
            ]);
        };

        it("replaces the cached folder with the one the server has now", async () => {
            seed([], []);
            const { receive, fetched } = setup(
                folderDto({ title: "Renamed", permissions: [viewer] })
            );

            await receive({ action: "aco.folder.updated", data: { id: "folder-1" } });

            expect(fetched).toEqual(["folder-1"]);
            const updated = cache().getItem(f => f.id === "folder-1");
            expect(updated?.title).toBe("Renamed");
            expect(updated?.permissions).toEqual([viewer]);
        });

        it("passes access granted on a parent down to its cached children", async () => {
            seed([], []);
            const { receive } = setup(folderDto({ permissions: [viewer] }));

            await receive({ action: "aco.folder.updated", data: { id: "folder-1" } });

            expect(child()?.permissions).toEqual([{ ...viewer, inheritedFrom: "parent:folder-1" }]);
        });

        it("takes access revoked on a parent away from its cached children", async () => {
            seed([viewer], [{ ...viewer, inheritedFrom: "parent:folder-1" }]);
            const { receive } = setup(folderDto({ permissions: [] }));

            await receive({ action: "aco.folder.updated", data: { id: "folder-1" } });

            expect(child()?.permissions).toEqual([]);
        });
    });

    describe("deletes", () => {
        it("removes a deleted folder from the cache it was in", async () => {
            folderCacheFactory
                .getCache("cms:article")
                .addItems([
                    Folder.create(folderDto({ type: "cms:article" })),
                    Folder.create(folderDto({ id: "folder-2", type: "cms:article" }))
                ]);
            const { receive, fetched } = setup(folderDto());

            await receive({ action: "aco.folder.deleted", data: { id: "folder-1" } });

            // A deleted folder cannot be read back, so nothing is fetched.
            expect(fetched).toEqual([]);
            expect(
                folderCacheFactory
                    .getCache("cms:article")
                    .getItems()
                    .map(f => f.id)
            ).toEqual(["folder-2"]);
        });

        it("ignores a folder the cache never held", async () => {
            folderCacheFactory.getCache("FmFile").addItems([Folder.create(folderDto())]);
            const { receive } = setup(folderDto());

            await receive({ action: "aco.folder.deleted", data: { id: "unknown" } });

            expect(folderCacheFactory.getCache("FmFile").count()).toBe(1);
        });
    });

    it("ignores an action that only looks like a known key", async () => {
        const { receive, fetched } = setup(folderDto());

        await receive({ action: "toString", data: { id: "folder-1" } });

        expect(fetched).toEqual([]);
    });
});
