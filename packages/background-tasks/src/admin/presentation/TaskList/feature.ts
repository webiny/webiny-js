import { createFeature } from "@webiny/feature/admin";
import { TaskListPresenter as PresenterAbstraction } from "./abstractions.js";
import { TaskListPresenter } from "./TaskListPresenter.js";

export const TaskListPresenterFeature = createFeature({
    name: "BackgroundTasks/TaskListPresenter",
    register(container) {
        container.register(TaskListPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
