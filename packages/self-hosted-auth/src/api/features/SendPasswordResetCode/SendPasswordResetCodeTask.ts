import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskHandler } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { SendPasswordResetCodeUseCase } from "./abstractions.js";
import { SEND_PASSWORD_RESET_CODE_TASK } from "./abstractions.js";
import type { SendPasswordResetCodeInput } from "./abstractions.js";

/**
 * Runs `SendPasswordResetCodeUseCase` off the request. A failure is logged as well as returned,
 * because the task deletes itself when it ends and the log is the only record the operator gets.
 */
class SendPasswordResetCodeTaskHandlerImpl implements TaskHandler.Interface<SendPasswordResetCodeInput> {
    constructor(
        private sendCode: SendPasswordResetCodeUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async run({ input, controller }: TaskHandler.RunParams<SendPasswordResetCodeInput>) {
        const result = await this.sendCode.execute(input);

        if (result.isFail()) {
            this.logger.error(
                { codeId: input.codeId, code: result.error.code },
                "Could not send a password reset code."
            );
            return controller.response.error({
                message: result.error.message,
                code: result.error.code
            });
        }

        return controller.response.done();
    }
}

const SendPasswordResetCodeTaskHandler = TaskHandler.createImplementation({
    implementation: SendPasswordResetCodeTaskHandlerImpl,
    dependencies: [SendPasswordResetCodeUseCase, Logger]
});

class SendPasswordResetCodeTask implements TaskDefinition.Interface<SendPasswordResetCodeInput> {
    id = SEND_PASSWORD_RESET_CODE_TASK;
    title = "Send password reset code";
    description = "Emails a password reset code to an address that has an account.";
    // One attempt. A retry would mail a second code, and the user can ask for another.
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = false;
    // The input holds the address a reset was asked for. Nothing needs it once the task is over.
    selfCleanup = "always" as const;

    handler = SendPasswordResetCodeTaskHandler;
}

export const SendPasswordResetCodeTaskDefinition = TaskDefinition.createImplementation({
    implementation: SendPasswordResetCodeTask,
    dependencies: []
});
