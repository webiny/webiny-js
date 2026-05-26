import { createFeature } from "@webiny/feature/api";
import { AbortTaskUseCaseImpl } from "./AbortTaskUseCase.js";
import type { Context } from "~/api/types.js";
import { AbortTaskUseCase } from "./abstractions.js";

export const AbortTaskFeature = createFeature<Context>({
    name: "AbortTask",
    register(container, context) {
        container.registerInstance(AbortTaskUseCase, new AbortTaskUseCaseImpl(context!));
    }
});
