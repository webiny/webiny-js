import { describe, it, expect, vi, type Mock } from "vitest";
import { Container } from "@webiny/di";
import { WbPageStatus } from "~/constants.js";
import { Page } from "~/domain/Page/index.js";
import { PublishPageUseCase } from "~/features/pages/publishPage/abstractions.js";
import { UnpublishPageUseCase } from "~/features/pages/unpublishPage/abstractions.js";
import { MovePageUseCase } from "~/features/pages/movePage/abstractions.js";
import { DeletePageUseCase } from "~/features/pages/deletePage/abstractions.js";
import { DuplicatePageUseCase } from "~/features/pages/duplicatePage/abstractions.js";
import {
    BulkPublishPresenter as BulkPublishAbstraction,
    BulkUnpublishPresenter as BulkUnpublishAbstraction,
    BulkMovePresenter as BulkMoveAbstraction,
    BulkDeletePresenter as BulkDeleteAbstraction,
    BulkDuplicatePresenter as BulkDuplicateAbstraction
} from "./abstractions.js";
import { BulkPublishPresenter } from "./BulkPublishPresenter.js";
import { BulkUnpublishPresenter } from "./BulkUnpublishPresenter.js";
import { BulkMovePresenter } from "./BulkMovePresenter.js";
import { BulkDeletePresenter } from "./BulkDeletePresenter.js";
import { BulkDuplicatePresenter } from "./BulkDuplicatePresenter.js";

const createPage = (index: number) =>
    Page.create({
        id: `page-${index}#0001`,
        entryId: `page-${index}`,
        status: WbPageStatus.Draft,
        location: { folderId: "folder-1" },
        properties: { title: `Page ${index}` },
        metadata: {},
        elements: {},
        bindings: {}
    });

type UseCaseStub = { execute: Mock<(params: any) => Promise<any>> };

interface PresenterCase {
    name: string;
    setup(container: Container, useCase: UseCaseStub): void;
    run(container: Container, pages: Page[]): Promise<{ vm: { results: unknown[] } }>;
}

const cases: PresenterCase[] = [
    {
        name: "publish",
        setup: (container, useCase) => {
            container.registerInstance(PublishPageUseCase, useCase);
            container.register(BulkPublishPresenter);
        },
        run: async (container, pages) => {
            const presenter = container.resolve(BulkPublishAbstraction);
            await presenter.execute(pages);
            return presenter;
        }
    },
    {
        name: "unpublish",
        setup: (container, useCase) => {
            container.registerInstance(UnpublishPageUseCase, useCase);
            container.register(BulkUnpublishPresenter);
        },
        run: async (container, pages) => {
            const presenter = container.resolve(BulkUnpublishAbstraction);
            await presenter.execute(pages);
            return presenter;
        }
    },
    {
        name: "move",
        setup: (container, useCase) => {
            container.registerInstance(MovePageUseCase, useCase);
            container.register(BulkMovePresenter);
        },
        run: async (container, pages) => {
            const presenter = container.resolve(BulkMoveAbstraction);
            await presenter.execute(pages, "folder-2");
            return presenter;
        }
    },
    {
        name: "delete",
        setup: (container, useCase) => {
            container.registerInstance(DeletePageUseCase, useCase);
            container.register(BulkDeletePresenter);
        },
        run: async (container, pages) => {
            const presenter = container.resolve(BulkDeleteAbstraction);
            await presenter.execute(pages);
            return presenter;
        }
    },
    {
        name: "duplicate",
        setup: (container, useCase) => {
            container.registerInstance(DuplicatePageUseCase, useCase);
            container.register(BulkDuplicatePresenter);
        },
        run: async (container, pages) => {
            const presenter = container.resolve(BulkDuplicateAbstraction);
            await presenter.execute(pages);
            return presenter;
        }
    }
];

describe("Page bulk action presenters", () => {
    it.each(cases)("$name keeps going when one page fails", async ({ setup, run }) => {
        const pages = [createPage(1), createPage(2), createPage(3)];
        const useCase: UseCaseStub = {
            execute: vi
                .fn<(params: any) => Promise<any>>()
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error("Boom"))
                .mockResolvedValueOnce(undefined)
        };

        const container = new Container();
        setup(container, useCase);

        const presenter = await run(container, pages);

        expect(useCase.execute).toHaveBeenCalledTimes(3);
        expect(useCase.execute.mock.calls.map(([params]) => params.id)).toEqual(
            pages.map(page => page.id)
        );

        const results = presenter.vm.results as { title: string; status: string }[];
        expect(results.filter(r => r.status === "success").map(r => r.title)).toEqual([
            "Page 1",
            "Page 3"
        ]);
        expect(results.filter(r => r.status === "failure")).toEqual([
            { title: "Page 2", message: "Boom", status: "failure" }
        ]);
    });
});
