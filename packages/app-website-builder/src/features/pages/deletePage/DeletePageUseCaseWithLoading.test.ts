import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { loadingActions } from "~/constants.js";
import { WbPageLoadingRepository } from "~/features/pages/shared/abstractions.js";
import { DeletePageRepository } from "./abstractions.js";
import { DeletePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeletePageUseCase } from "./DeletePageUseCase.js";
import { DeletePageUseCaseWithLoading } from "./DeletePageUseCaseWithLoading.js";

describe("DeletePageUseCase result", () => {
    it("resolves true after the repository deleted the page", async () => {
        const repository = { execute: vi.fn(async () => undefined) };
        const container = new Container();
        container.registerInstance(DeletePageRepository, repository);
        container.register(DeletePageUseCase);

        const result = await container
            .resolve(UseCaseAbstraction)
            .execute({ id: "page-1#0001", permanently: false });

        expect(result).toBe(true);
        expect(repository.execute).toHaveBeenCalledTimes(1);
    });
});

describe("DeletePageUseCaseWithLoading", () => {
    function setup(decorateeResult: boolean) {
        const decoratee = { execute: vi.fn(async () => decorateeResult) };
        const loading = {
            runCallBack: vi.fn((promise: Promise<unknown>, _action: string) => promise)
        };
        const container = new Container();
        container.registerInstance(WbPageLoadingRepository, loading as never);
        container.registerInstance(UseCaseAbstraction, decoratee);
        container.registerDecorator(DeletePageUseCaseWithLoading);

        return { decoratee, loading, useCase: container.resolve(UseCaseAbstraction) };
    }

    it("runs the delete under the delete loading action and returns true", async () => {
        const { decoratee, loading, useCase } = setup(true);

        const result = await useCase.execute({ id: "page-1#0001", permanently: false });

        expect(result).toBe(true);
        expect(decoratee.execute).toHaveBeenCalledWith({ id: "page-1#0001", permanently: false });
        expect(loading.runCallBack).toHaveBeenCalledTimes(1);
        expect(loading.runCallBack.mock.calls[0][1]).toBe(loadingActions.delete);
    });

    it("passes a false result of the decoratee through (the warning was dismissed)", async () => {
        const { useCase } = setup(false);

        const result = await useCase.execute({ id: "page-1#0001", permanently: false });

        expect(result).toBe(false);
    });
});
