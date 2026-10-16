import { describe, it, expect, vi, type Mock } from "vitest";
import { Container } from "@webiny/di";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { CmsModelContext as CmsModelContextImpl } from "~/features/contentEntry/CmsModelContext.js";
import { BulkActionUseCase } from "~/features/contentEntry/bulkAction/abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntry/publishEntry/abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/unpublishEntry/abstractions.js";
import { MoveEntryUseCase } from "~/features/contentEntry/moveEntry/abstractions.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import {
    BulkPublishPresenter as BulkPublishAbstraction,
    BulkUnpublishPresenter as BulkUnpublishAbstraction,
    BulkMovePresenter as BulkMoveAbstraction,
    BulkDeletePresenter as BulkDeleteAbstraction
} from "./abstractions.js";
import { BulkPublishPresenter } from "./BulkPublishPresenter.js";
import { BulkUnpublishPresenter } from "./BulkUnpublishPresenter.js";
import { BulkMovePresenter } from "./BulkMovePresenter.js";
import { BulkDeletePresenter } from "./BulkDeletePresenter.js";

const MODEL = {
    modelId: "testModel",
    name: "Test Model",
    singularApiName: "TestModel",
    pluralApiName: "TestModels",
    fields: [],
    layout: [],
    titleFieldId: "title"
} as unknown as CmsModel;

const createEntry = (index: number) =>
    ({
        id: `entry-${index}#0001`,
        entryId: `entry-${index}`,
        meta: { title: `Entry ${index}` }
    }) as unknown as CmsContentEntry;

type Presenter = { vm: { results: unknown[] } };

type UseCaseStub = { execute: Mock<(params: any) => Promise<any>> };

interface PresenterCase {
    name: string;
    setup(container: Container, useCase: UseCaseStub): void;
    run(container: Container, entries: CmsContentEntry[]): Promise<Presenter>;
}

const cases: PresenterCase[] = [
    {
        name: "publish",
        setup: (container, useCase) => {
            container.registerInstance(PublishEntryUseCase, useCase);
            container.register(BulkPublishPresenter);
        },
        run: async (container, entries) => {
            const presenter = container.resolve(BulkPublishAbstraction);
            await presenter.execute(entries, false);
            return presenter;
        }
    },
    {
        name: "unpublish",
        setup: (container, useCase) => {
            container.registerInstance(UnpublishEntryUseCase, useCase);
            container.register(BulkUnpublishPresenter);
        },
        run: async (container, entries) => {
            const presenter = container.resolve(BulkUnpublishAbstraction);
            await presenter.execute(entries, false);
            return presenter;
        }
    },
    {
        name: "move",
        setup: (container, useCase) => {
            container.registerInstance(MoveEntryUseCase, useCase);
            container.register(BulkMovePresenter);
        },
        run: async (container, entries) => {
            const presenter = container.resolve(BulkMoveAbstraction);
            await presenter.execute(entries, false, "folder-2");
            return presenter;
        }
    },
    {
        name: "delete",
        setup: (container, useCase) => {
            container.registerInstance(DeleteEntryUseCase, useCase);
            container.register(BulkDeletePresenter);
        },
        run: async (container, entries) => {
            const presenter = container.resolve(BulkDeleteAbstraction);
            await presenter.execute(entries, false);
            return presenter;
        }
    }
];

describe("Content entry bulk action presenters", () => {
    it.each(cases)("$name keeps going when one entry fails", async ({ setup, run }) => {
        const entries = [createEntry(1), createEntry(2), createEntry(3)];
        const useCase: UseCaseStub = {
            execute: vi
                .fn<(params: any) => Promise<any>>()
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error("Boom"))
                .mockResolvedValueOnce(undefined)
        };
        const bulkActionUseCase = { execute: vi.fn<(params: any) => Promise<any>>() };

        const container = new Container();
        container.register(CmsModelContextImpl).inSingletonScope();
        container.resolve(CmsModelContext).setModel(MODEL);
        container.registerInstance(BulkActionUseCase, bulkActionUseCase);
        setup(container, useCase);

        const presenter = await run(container, entries);

        expect(bulkActionUseCase.execute).not.toHaveBeenCalled();
        expect(useCase.execute).toHaveBeenCalledTimes(3);

        const results = presenter.vm.results as { title: string; status: string }[];
        expect(results.filter(r => r.status === "success").map(r => r.title)).toEqual([
            "Entry 1",
            "Entry 3"
        ]);
        expect(results.filter(r => r.status === "failure")).toEqual([
            { title: "Entry 2", message: "Boom", status: "failure" }
        ]);
    });
});
