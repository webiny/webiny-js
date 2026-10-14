import type { ZodType } from "zod";
import { Result } from "@webiny/feature/api";
import { StepType } from "~/features/stepTypes/StepType/index.js";
import type { WorkflowValidationError } from "~/domain/workflow/errors.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";

export interface TestStepTypeOptions {
    type: string;
    title?: string;
    configSchema?: ZodType | null;
    availability?: StepType.Availability;
    /** Replaces `availability`; use it to make `describeAvailability` throw. */
    describeAvailability?: () => Promise<StepType.Availability>;
    /** Defaults to accepting the step as it is. */
    validate?: (params: StepType.ValidateParams) => Result<WorkflowStep, WorkflowValidationError>;
}

/**
 * A step type for tests. `validateCalls` records every `validate` call, in order. Register the
 * `implementation` after `WorkflowsFeature` (a `setup` callback of `createContextHandler`).
 */
export const createTestStepType = (options: TestStepTypeOptions) => {
    const validateCalls: StepType.ValidateParams[] = [];

    class TestStepTypeImpl implements StepType.Interface {
        public readonly type = options.type;
        public readonly title = options.title ?? options.type;
        public readonly configSchema = options.configSchema ?? null;

        public async describeAvailability(): Promise<StepType.Availability> {
            if (options.describeAvailability) {
                return options.describeAvailability();
            }
            return options.availability ?? { available: true, unavailableReason: null };
        }

        public validate(params: StepType.ValidateParams) {
            validateCalls.push(params);
            return options.validate ? options.validate(params) : Result.ok(params.step);
        }

        public async reach() {
            return Result.ok();
        }
    }

    return {
        validateCalls,
        implementation: StepType.createImplementation({
            implementation: TestStepTypeImpl,
            dependencies: []
        })
    };
};
