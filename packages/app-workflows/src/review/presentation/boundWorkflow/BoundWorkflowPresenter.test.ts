import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import { BoundWorkflowPresenter } from "./abstractions.js";
import { BoundWorkflowFeature } from "./feature.js";

const WORKFLOW = { id: "workflow-1", namespaces: ["cms.article"] } as unknown as ReviewWorkflow;

describe("BoundWorkflowPresenter", () => {
    let execute: Mock<GetBoundWorkflowUseCase.Interface["execute"]>;
    let container: Container;

    beforeEach(() => {
        execute = vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>();
        container = new Container();
        container.registerInstance(GetBoundWorkflowUseCase, { execute });
        BoundWorkflowFeature.register(container);
    });

    it("starts as loading", () => {
        const presenter = container.resolve(BoundWorkflowPresenter);

        expect(presenter.vm.status).toBe("loading");
    });

    it("reports a namespace a workflow binds as bound", async () => {
        execute.mockResolvedValue(WORKFLOW);
        const presenter = container.resolve(BoundWorkflowPresenter);

        await presenter.load("cms.article");

        expect(presenter.vm.status).toBe("bound");
        expect(execute).toHaveBeenCalledWith({ namespace: "cms.article" });
    });

    it("reports a namespace no workflow binds as unbound", async () => {
        execute.mockResolvedValue(null);
        const presenter = container.resolve(BoundWorkflowPresenter);

        await presenter.load("cms.article");

        expect(presenter.vm.status).toBe("unbound");
    });

    it("reports a failed lookup as failed", async () => {
        execute.mockRejectedValue(new Error("Network down"));
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const presenter = container.resolve(BoundWorkflowPresenter);

        await presenter.load("cms.article");

        expect(presenter.vm.status).toBe("failed");
    });

    it("ignores the answer for a namespace it no longer shows", async () => {
        let resolveFirst: (value: ReviewWorkflow | null) => void = () => undefined;
        execute.mockImplementationOnce(() => {
            return new Promise(resolve => {
                resolveFirst = resolve;
            });
        });
        execute.mockResolvedValueOnce(null);
        const presenter = container.resolve(BoundWorkflowPresenter);

        const first = presenter.load("cms.article");
        await presenter.load("cms.author");
        resolveFirst(WORKFLOW);
        await first;

        expect(presenter.vm.status).toBe("unbound");
    });
});
