import zod from "zod";
import { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { CreateTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/index.js";
import { TasksRepository } from "~/api/domain/task/abstractions.js";
import { TaskInputValidationError } from "~/api/domain/errors.js";
import { TaskAfterCreateEvent, TaskBeforeCreateEvent } from "~/api/events/index.js";

type InputSchema = GenericRecord<string, zod.ZodTypeAny> | zod.ZodTypeAny;

const toZodSchema = (schema: InputSchema) => {
    if (!schema) {
        return zod.looseObject({});
    } else if (schema instanceof zod.ZodObject) {
        return schema.loose();
    } else if (schema instanceof zod.ZodType) {
        return schema;
    }
    return zod.looseObject(schema);
};

const validateInput = async (
    definition: Pick<TaskDefinition.Runnable, "createInputValidation">,
    input: unknown
): Promise<zod.ZodError | null> => {
    if (!definition.createInputValidation) {
        return null;
    }
    const schema = toZodSchema(definition.createInputValidation({ validator: zod }));
    const result = await schema.safeParseAsync(input);
    return result.success ? null : result.error;
};

class CreateTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly getDefinition: GetRunnableTaskDefinitionUseCase.Interface,
        private readonly eventPublisher: EventPublisher.Interface,
        private readonly repository: TasksRepository.Interface
    ) {}

    async execute<I extends TaskService.TaskInput = TaskService.TaskInput>(
        data: UseCaseAbstraction.Params<I>
    ): Promise<Result<TaskService.Task<I>, UseCaseAbstraction.Error>> {
        const definition = this.getDefinition.execute(data.definitionId);
        if (definition.isFail()) {
            return Result.fail(definition.error);
        }

        const invalid = await validateInput(definition.value, data.input);
        if (invalid) {
            return Result.fail(new TaskInputValidationError(invalid));
        }

        await this.eventPublisher.publish(new TaskBeforeCreateEvent({ input: data }));

        const result = await this.repository.create<I>(data);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new TaskAfterCreateEvent({ input: data, task: result.value })
        );

        return Result.ok(result.value);
    }
}

export const CreateTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateTaskUseCaseImpl,
    dependencies: [GetRunnableTaskDefinitionUseCase, EventPublisher, TasksRepository]
});
