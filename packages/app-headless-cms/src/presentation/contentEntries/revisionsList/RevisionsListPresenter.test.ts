/**
 * @vitest-environment jsdom
 */
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import type { CmsModel } from "~/types.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { ListRevisionsUseCase } from "~/features/contentEntry/listRevisions/abstractions.js";
import { CreateRevisionFromUseCase } from "~/features/contentEntry/createRevisionFrom/abstractions.js";
import { DeleteEntryRevisionUseCase } from "~/features/contentEntry/deleteEntryRevision/abstractions.js";
import { RevisionsListPresenter as Abstraction } from "./abstractions.js";
import { DELETE_REVISION_DIALOG } from "./RevisionsListPresenter.js";
import { RevisionsListPresenter } from "./RevisionsListPresenter.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

type ConfirmResult = undefined | false;

function setup(confirmed: ConfirmResult, deleteRevision: () => Promise<boolean>) {
    const container = new Container();
    const confirm = vi.fn(async (_name: string, _params: unknown) => confirmed);
    const deleteUseCase = { execute: vi.fn(deleteRevision) };

    container.registerInstance(Confirmation, { confirm } as unknown as Confirmation.Interface);
    container.registerInstance(CmsModelContext, { getModel: () => MODEL, setModel: vi.fn() });
    container.registerInstance(ListRevisionsUseCase, { execute: vi.fn(async () => []) });
    container.registerInstance(CreateRevisionFromUseCase, { execute: vi.fn() });
    container.registerInstance(DeleteEntryRevisionUseCase, deleteUseCase);
    container.register(RevisionsListPresenter).inSingletonScope();

    return { confirm, deleteUseCase, presenter: container.resolve(Abstraction) };
}

describe("RevisionsListPresenter.deleteRevision", () => {
    it("runs the delete after a real confirm, which resolves undefined, and returns true", async () => {
        const { confirm, deleteUseCase, presenter } = setup(undefined, async () => true);

        const result = await presenter.deleteRevision("entry-1#0002");

        expect(result).toBe(true);
        expect(confirm).toHaveBeenCalledWith(DELETE_REVISION_DIALOG, {
            revisionId: "entry-1#0002"
        });
        expect(deleteUseCase.execute).toHaveBeenCalledWith({
            model: MODEL,
            revisionId: "entry-1#0002"
        });
    });

    it("does not delete when the dialog is cancelled (confirm resolves false)", async () => {
        const { deleteUseCase, presenter } = setup(false, async () => true);

        const result = await presenter.deleteRevision("entry-1#0002");

        expect(result).toBe(false);
        expect(deleteUseCase.execute).not.toHaveBeenCalled();
    });

    it("returns false when the use case returns false (warning dismissed)", async () => {
        const { deleteUseCase, presenter } = setup(undefined, async () => false);

        const result = await presenter.deleteRevision("entry-1#0002");

        expect(result).toBe(false);
        expect(deleteUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it("returns false and clears loading when the use case throws", async () => {
        const { presenter } = setup(undefined, async () => {
            throw new Error("Network down");
        });

        const result = await presenter.deleteRevision("entry-1#0002");

        expect(result).toBe(false);
        expect(presenter.vm.loading).toBe(false);
    });
});
