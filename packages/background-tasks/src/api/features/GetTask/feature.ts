import { createFeature } from "@webiny/feature/api";
import { GetTaskUseCaseImpl } from "./GetTaskUseCase.js";
import { GetTaskUseCase } from "./abstractions.js";
import { TasksCrud } from "~/api/TasksCrud.js";

export const GetTaskFeature = createFeature({
    name: "GetTask",
    register(container) {
        container.registerFactory(GetTaskUseCase, () => {
            return new GetTaskUseCaseImpl(container.resolve(TasksCrud));
        });
    }
});
