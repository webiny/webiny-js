import { createFeature } from "@webiny/feature/api";
import { TriggerTaskUseCase } from "./abstractions.js";
import { TriggerTaskUseCaseImpl } from "~/features/TriggerTask/TriggerTaskUseCase.js";
import type { Context } from "~/types.js";

export const TriggerTaskFeature = createFeature<Context>({
    name: "TriggerTask",
    register(container, context) {
        container.registerInstance(TriggerTaskUseCase, new TriggerTaskUseCaseImpl(context!));
    }
});
