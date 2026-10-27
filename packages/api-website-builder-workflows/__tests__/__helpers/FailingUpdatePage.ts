import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { PageValidationError } from "@webiny/api-website-builder/domain/page/errors.js";
import { UpdatePageUseCase } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";

export interface UpdatePageFaults {
    /** Makes `UpdatePageUseCase` throw. */
    throwing: boolean;
    /** Makes `UpdatePageUseCase` fail with a `PageValidationError` carrying raw provider text. */
    validation: boolean;
}

/** Reset it in `beforeEach`. */
export const updatePageFaults: UpdatePageFaults = { throwing: false, validation: false };

class FailingUpdatePage implements UpdatePageUseCase.Interface {
    public constructor(private decoratee: UpdatePageUseCase.Interface) {}

    public async execute(id: string, data: UpdatePageUseCase.UpdateData): UpdatePageUseCase.Return {
        if (updatePageFaults.throwing) {
            throw new Error("Storage is down.");
        }
        if (updatePageFaults.validation) {
            return Result.fail(
                new PageValidationError("Validator failed: connect ECONNREFUSED 10.0.0.5:9200")
            );
        }
        return this.decoratee.execute(id, data);
    }
}

/** Makes `UpdatePageUseCase` throw or fail validation as `updatePageFaults` says (`legacyPlugins`). */
export const failUpdatePage = (container: Container) => {
    container.registerDecorator(
        UpdatePageUseCase.createDecorator({ decorator: FailingUpdatePage, dependencies: [] })
    );
};
