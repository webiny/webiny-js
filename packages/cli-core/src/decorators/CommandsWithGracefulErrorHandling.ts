import { Command, ErrorHandler } from "~/abstractions/index.js";
import { GracefulError } from "@webiny/project";

export class CommandsWithGracefulErrorHandling<TParams> implements Command.Interface<TParams> {
    constructor(
        private gracefulErrorHandlers: ErrorHandler.Interface<TParams>[],
        private decoratee: Command.Interface<TParams>
    ) {}

    async execute() {
        const command = await this.decoratee.execute();

        const originalCommandHandler = command.handler;

        command.handler = async (params: TParams) => {
            try {
                await originalCommandHandler(params);
            } catch (error) {
                if (error instanceof GracefulError) {
                    throw error;
                }

                for (const gracefulErrorHandler of this.gracefulErrorHandlers) {
                    gracefulErrorHandler.execute({
                        error,
                        command,
                        params
                    });
                }

                throw error;
            }
        };

        return command;
    }
}

export const commandsWithGracefulErrorHandling = Command.createDecorator({
    decorator: CommandsWithGracefulErrorHandling,
    dependencies: [[ErrorHandler, { multiple: true }]]
});
