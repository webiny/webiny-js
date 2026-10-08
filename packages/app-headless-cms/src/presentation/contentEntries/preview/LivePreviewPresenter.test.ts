import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { GetModelUseCase } from "~/features/model/getModel/abstractions.js";
import { GetEntryUseCase } from "~/features/contentEntry/getEntry/abstractions.js";
import { LivePreviewPresenter as Abstraction } from "./abstractions.js";
import { LivePreviewPresenter } from "./LivePreviewPresenter.js";

const setup = () => {
    const getModel = vi.fn(async ({ modelId }: { modelId: string }) => ({ modelId, fields: [] }));
    const getEntry = vi.fn(async ({ id }: { id: string }) => {
        if (id === "missing#0001") {
            throw new Error("Entry not found.");
        }
        return { id, values: { slug: "baker" } };
    });

    const container = new Container();
    container.registerInstance(GetModelUseCase, {
        execute: getModel
    } as unknown as GetModelUseCase.Interface);
    container.registerInstance(GetEntryUseCase, {
        execute: getEntry
    } as unknown as GetEntryUseCase.Interface);
    container.register(LivePreviewPresenter);

    return { presenter: container.resolve(Abstraction), getModel, getEntry };
};

describe("LivePreviewPresenter", () => {
    it("should load each referenced entry once and expose its values", async () => {
        const { presenter, getEntry } = setup();
        const ref = { id: "loc1#0001", modelId: "location" };

        presenter.loadRefValues([ref]);
        presenter.loadRefValues([ref]);

        await vi.waitFor(() => {
            expect(presenter.vm.refValues[ref.id]).toEqual({ slug: "baker" });
        });
        expect(getEntry).toHaveBeenCalledTimes(1);
        expect(getEntry).toHaveBeenCalledWith({
            model: { modelId: "location", fields: [] },
            id: ref.id
        });
    });

    it("should mark a ref that fails to load and not request it again", async () => {
        const { presenter, getEntry } = setup();
        const ref = { id: "missing#0001", modelId: "location" };

        presenter.loadRefValues([ref]);

        await vi.waitFor(() => {
            expect(presenter.vm.refValues[ref.id]).toBeNull();
        });

        presenter.loadRefValues([ref]);
        expect(getEntry).toHaveBeenCalledTimes(1);
    });
});
