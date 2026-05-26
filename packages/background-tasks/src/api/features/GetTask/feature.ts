import { createFeature } from "@webiny/feature/api";
import { GetTaskUseCaseImpl } from "./GetTaskUseCase.js";
import type { Context } from "~/api/types.js";
import { GetTaskUseCase } from "./abstractions.js";

export const GetTaskFeature = createFeature<Context>({
    name: "GetTask",
    register(container, context) {
        container.registerInstance(GetTaskUseCase, new GetTaskUseCaseImpl(context!));
    }
});
