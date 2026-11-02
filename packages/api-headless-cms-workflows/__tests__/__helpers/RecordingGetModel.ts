import type { Container } from "@webiny/di";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";

/** The model id of every model read. Clear it in `beforeEach`. */
export const modelReads: string[] = [];

class RecordingGetModel implements GetModelUseCase.Interface {
    public constructor(private decoratee: GetModelUseCase.Interface) {}

    public async execute(modelId: string): GetModelUseCase.Return {
        modelReads.push(modelId);
        return this.decoratee.execute(modelId);
    }
}

/** Records every model read in `modelReads` (`legacyPlugins`). */
export const recordModelReads = (container: Container) => {
    container.registerDecorator(
        GetModelUseCase.createDecorator({ decorator: RecordingGetModel, dependencies: [] })
    );
};
