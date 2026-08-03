import type { CreateThemeUseCase } from "~/features/CreateTheme/index.js";

export const themeMocks = {
    /** Minimal input — everything but the name is seeded from the default theme. */
    blank: {
        properties: { name: "Northbeam 2026", description: "Primary brand theme" }
    } satisfies CreateThemeUseCase.Params,

    second: {
        properties: { name: "Winter campaign" }
    } satisfies CreateThemeUseCase.Params
};
