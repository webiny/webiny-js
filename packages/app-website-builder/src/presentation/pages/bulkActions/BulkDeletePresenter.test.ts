import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Page } from "~/domain/Page/Page.js";
import { DeletePageUseCase } from "~/features/pages/deletePage/abstractions.js";
import { BulkDeletePresenter as Abstraction } from "./abstractions.js";
import { BulkDeletePresenter } from "./BulkDeletePresenter.js";

function page(entryId: string): Page {
    return Page.create({
        id: `${entryId}#0001`,
        entryId,
        properties: { title: `Title ${entryId}` }
    });
}

function setup(results: Record<string, Error | boolean> = {}) {
    const container = new Container();
    const deletePage = {
        execute: vi.fn(async (params: { id: string }) => {
            const outcome = results[params.id.split("#")[0]] ?? true;
            if (outcome instanceof Error) {
                throw outcome;
            }
            return outcome;
        })
    };
    container.registerInstance(DeletePageUseCase, deletePage);
    container.register(BulkDeletePresenter);

    return { deletePage, presenter: container.resolve(Abstraction) };
}

describe("BulkDeletePresenter", () => {
    it("deletes every page and reports each as a success", async () => {
        const { deletePage, presenter } = setup();

        await presenter.execute([page("p1"), page("p2")]);

        expect(deletePage.execute).toHaveBeenCalledTimes(2);
        expect(deletePage.execute).toHaveBeenCalledWith({ id: "p1#0001", permanently: false });
        expect(presenter.vm.results.map(result => result.status)).toEqual(["success", "success"]);
    });

    it("reports a page whose delete returned false as a failure and continues with the rest", async () => {
        const { deletePage, presenter } = setup({ p1: false });

        await presenter.execute([page("p1"), page("p2"), page("p3")]);

        expect(deletePage.execute).toHaveBeenCalledTimes(3);
        const byTitle = Object.fromEntries(
            presenter.vm.results.map(result => [result.title, result])
        );
        expect(byTitle["Title p1"].status).toBe("failure");
        expect(byTitle["Title p1"].message).toBe("The page was not deleted.");
        expect(byTitle["Title p2"].status).toBe("success");
        expect(byTitle["Title p3"].status).toBe("success");
    });

    it("leaves non-workflow error behaviour unchanged: a thrown error still rejects execute", async () => {
        const failure = new Error("Network down");
        const { presenter } = setup({ p1: failure });

        const error = await presenter.execute([page("p1")]).catch(e => e);

        expect(error).toBe(failure);
    });
});
