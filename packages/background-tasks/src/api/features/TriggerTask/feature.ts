import { createFeature } from "@webiny/feature/api";
import { TriggerTaskUseCase } from "./abstractions.js";
import { TriggerTaskUseCaseImpl } from "~/api/features/TriggerTask/TriggerTaskUseCase.js";
import type { Context } from "~/api/types.js";

export const TriggerTaskFeature = createFeature<Context>({
    name: "TriggerTask",
    register(container, context) {
        container.registerInstance(TriggerTaskUseCase, new TriggerTaskUseCaseImpl(context!));
    }
});
