import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { CopyCurrentUrlCommand } from "./CopyCurrentUrlCommand.js";
import { SignOutCommand } from "./SignOutCommand.js";
import { SendMessageCommand } from "./SendMessageCommand.js";

/**
 * Baseline command-palette actions available everywhere in the admin app. Registered
 * as DI commands; other modules register their own via `Command.createImplementation`.
 */
export const AdminCommandsFeature = createFeature({
    name: "AdminCommands",
    register(container: Container) {
        container.register(CopyCurrentUrlCommand);
        container.register(SignOutCommand);
        // Demo of the detail-view capability — safe to remove.
        container.register(SendMessageCommand);
    }
});
