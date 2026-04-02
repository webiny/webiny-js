import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { CommandPalettePresenter as Abstraction } from "./abstractions.js";
import { CommandPalettePresenter } from "./CommandPalettePresenter.js";
import { Command } from "./abstractions.js";

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
