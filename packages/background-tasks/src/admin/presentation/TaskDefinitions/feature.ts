import { createFeature } from "@webiny/feature/admin";
import { TaskDefinitionsPresenter as PresenterAbstraction } from "./abstractions.js";
import { TaskDefinitionsPresenter } from "./TaskDefinitionsPresenter.js";

export const TaskDefinitionsPresenterFeature = createFeature({
    name: "BackgroundTasks/TaskDefinitionsPresenter",
    register(container) {
        container.register(TaskDefinitionsPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
