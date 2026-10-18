/**
 * @vitest-environment jsdom
 */
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import type { CmsContentEntry } from "~/types.js";
import type { CmsModel } from "~/types.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { BulkActionUseCase } from "~/features/contentEntry/bulkAction/abstractions.js";
import { BulkDeletePresenter as Abstraction } from "./abstractions.js";
import { BulkDeletePresenter } from "./BulkDeletePresenter.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

function entry(entryId: string): CmsContentEntry {
    return {
        id: `${entryId}#0001`,
        entryId,
        meta: { title: `Title ${entryId}` }
    } as CmsContentEntry;
}

function setup(outcomes: Record<string, Error | boolean> = {}) {
    const container = new Container();
    const deleteEntry = {
        execute: vi.fn(async (params: { id: string }) => {
            const outcome = outcomes[params.id] ?? true;
            if (outcome instanceof Error) {
                throw outcome;
            }
            return outcome;
        })
    };
    const bulkAction = { execute: vi.fn(async () => ({ id: "task-1" })) };

    container.registerInstance(CmsModelContext, { getModel: () => MODEL, setModel: vi.fn() });
    container.registerInstance(DeleteEntryUseCase, deleteEntry);
    container.registerInstance(BulkActionUseCase, bulkAction);
    container.register(BulkDeletePresenter);

    return { deleteEntry, bulkAction, presenter: container.resolve(Abstraction) };
}

describe("BulkDeletePresenter", () => {
    it("trashes every item and reports each as a success", async () => {
        const { deleteEntry, presenter } = setup();

        await presenter.execute([entry("e1"), entry("e2")], false);

        expect(deleteEntry.execute).toHaveBeenCalledTimes(2);
        expect(presenter.vm.results.map(result => result.status)).toEqual(["success", "success"]);
    });

    it("reports an entry whose trash returned false as a failure and continues with the rest", async () => {
        const { deleteEntry, presenter } = setup({ e1: false });

        await presenter.execute([entry("e1"), entry("e2"), entry("e3")], false);

        expect(deleteEntry.execute).toHaveBeenCalledTimes(3);
        const byTitle = Object.fromEntries(
            presenter.vm.results.map(result => [result.title, result])
        );
        expect(byTitle["Title e1"].status).toBe("failure");
        expect(byTitle["Title e1"].message).toBe("The entry was not moved to trash.");
        expect(byTitle["Title e2"].status).toBe("success");
        expect(byTitle["Title e3"].status).toBe("success");
    });

    it("leaves non-workflow error behaviour unchanged: a thrown error still rejects execute", async () => {
        const failure = new Error("Network down");
        const { presenter } = setup({ e1: failure });

        const error = await presenter.execute([entry("e1")], false).catch(e => e);

        expect(error).toBe(failure);
    });

    it("uses the background bulk action when all are selected", async () => {
        const { deleteEntry, bulkAction, presenter } = setup();

        await presenter.execute([entry("e1"), entry("e2")], true);

        expect(deleteEntry.execute).not.toHaveBeenCalled();
        expect(bulkAction.execute).toHaveBeenCalledWith({
            model: MODEL,
            action: "MoveToTrash",
            where: { id_in: ["e1#0001", "e2#0001"] }
        });
    });

    it("reports true after the per-item series ran", async () => {
        const { presenter } = setup();

        const started = await presenter.execute([entry("e1")], false);

        expect(started).toBe(true);
    });

    it("reports true once the background bulk action was started", async () => {
        const { presenter } = setup();

        const started = await presenter.execute([entry("e1")], true);

        expect(started).toBe(true);
    });
});
