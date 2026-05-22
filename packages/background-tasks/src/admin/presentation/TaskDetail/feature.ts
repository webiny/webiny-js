import { createFeature } from "@webiny/feature/admin";
import { TaskDetailPresenter as PresenterAbstraction } from "./abstractions.js";
import { TaskDetailPresenter } from "./TaskDetailPresenter.js";

export const TaskDetailPresenterFeature = createFeature({
    name: "BackgroundTasks/TaskDetailPresenter",
    register(container) {
        container.register(TaskDetailPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
