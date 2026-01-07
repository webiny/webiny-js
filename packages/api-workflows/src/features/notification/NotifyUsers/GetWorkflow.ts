import { IWorkflow } from "~/domain/workflow/abstractions.js";
import { GetWorkflow as GetWorkflowAbstraction } from "./abstractions.js";
import { GetWorkflowRepository } from "~/features/workflow/GetWorkflow/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";

class GetWorkflowImpl implements GetWorkflowAbstraction.Interface {
    public constructor(
        private logger: Logger.Interface,
        private getWorkflowRepository: GetWorkflowRepository.Interface
    ) {}

    public async execute(params: GetWorkflowAbstraction.Params): Promise<IWorkflow | null> {
        const result = await this.getWorkflowRepository.execute({
            id: params.id,
            app: params.app
        });
        if (result.isFail()) {
            this.logger.error(
                `Could not load workflow "${params.id}"/${params.app}. More in a log below this line.`
            );
            this.logger.log(result.error);
            return null;
        }

        return result.value;
    }
}

export const GetWorkflow = GetWorkflowAbstraction.createImplementation({
    implementation: GetWorkflowImpl,
    dependencies: [Logger, GetWorkflowRepository]
});
