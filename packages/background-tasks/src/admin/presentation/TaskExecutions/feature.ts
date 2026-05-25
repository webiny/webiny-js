import { createFeature } from "@webiny/feature/admin";
import { TaskExecutionsPresenter as PresenterAbstraction } from "./abstractions.js";
import { TaskExecutionsPresenter } from "./TaskExecutionsPresenter.js";

export const TaskExecutionsPresenterFeature = createFeature({
    name: "BackgroundTasks/TaskExecutionsPresenter",
    register(container) {
        container.register(TaskExecutionsPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
