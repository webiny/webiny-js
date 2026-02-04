import { createFeature } from "@webiny/feature/api";
import { ListTasksUseCaseImpl } from "./ListTasksUseCase.js";
import type { Context } from "~/types.js";
import { ListTasksUseCase } from "./abstractions.js";

export const ListTasksFeature = createFeature<Context>({
    name: "ListTasks",
    register(container, context) {
        container.registerInstance(ListTasksUseCase, new ListTasksUseCaseImpl(context!));
    }
});
