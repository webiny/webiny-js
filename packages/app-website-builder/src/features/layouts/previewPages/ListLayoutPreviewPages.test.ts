import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { Page, pageListCache } from "~/domain/Page/index.js";
import { ListPagesGateway } from "~/features/pages/listPages/abstractions.js";
import { ListLayoutPreviewPagesUseCase } from "./abstractions.js";
import { LayoutPreviewPagesFeature } from "./feature.js";

const page = (id: string, title: string, path: string, language: string) =>
    Page.create({ id, entryId: id.split("#")[0], properties: { title, path, language } });

describe("ListLayoutPreviewPages", () => {
    const gateway = { execute: vi.fn() };
    let useCase: ListLayoutPreviewPagesUseCase.Interface;

    beforeEach(() => {
        vi.clearAllMocks();
        pageListCache.clear();
        gateway.execute.mockResolvedValue({
            data: [
                page("home#0002", "Home", "/", "en"),
                page("ueber#0001", "Über uns", "/de/ueber-uns", "de"),
                page("about#0001", "About", "/about", "en")
            ],
            meta: { cursor: null, totalCount: 3, hasMoreItems: false }
        });

        const container = new Container();
        container.registerInstance(MainGraphQLClient, { execute: vi.fn() } as any);
        LayoutPreviewPagesFeature.register(container);
        container.registerInstance(ListPagesGateway, gateway);
        useCase = container.resolve(ListLayoutPreviewPagesUseCase);
    });

    it("lists the most recently saved pages in every language, by title", async () => {
        const result = await useCase.execute();

        expect(gateway.execute).toHaveBeenCalledWith({
            limit: 50,
            sort: ["savedOn_DESC"],
            search: undefined
        });
        expect(result).toEqual([
            { id: "about#0001", title: "About", path: "/about" },
            { id: "home#0002", title: "Home", path: "/" },
            { id: "ueber#0001", title: "Über uns", path: "/de/ueber-uns" }
        ]);
        // Listed through the pages list, which keeps what it loads in its cache.
        expect(pageListCache.getItems().map(item => item.id)).toHaveLength(3);
    });

    it("searches the pages by the typed text", async () => {
        await useCase.execute("  about ");

        expect(gateway.execute).toHaveBeenCalledWith(expect.objectContaining({ search: "about" }));
    });

    it("lists the latest pages for an empty search", async () => {
        await useCase.execute("   ");

        expect(gateway.execute).toHaveBeenCalledWith(
            expect.objectContaining({ search: undefined })
        );
    });
});
