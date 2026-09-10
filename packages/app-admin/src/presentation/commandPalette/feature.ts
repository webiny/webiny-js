import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { CommandPalettePresenter as Abstraction, Command } from "./abstractions.js";
import { CommandPalettePresenter } from "./CommandPalettePresenter.js";

export const CommandPaletteFeature = createFeature({
    name: "CommandPalette",
    register(container: Container) {
        container.registerFactory(Abstraction, () => {
            return new CommandPalettePresenter(() => {
                return container.resolveAll(Command);
            });
        });
    },
    resolve(container: Container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
