import { createFeature } from "@webiny/feature/admin";
import { SchedulerListPresenter as PresenterAbstraction } from "./abstractions.js";
import { SchedulerListPresenter } from "./SchedulerListPresenter.js";

export const SchedulerListPresenterFeature = createFeature({
    name: "Scheduler/ListPresenter",
    register(container) {
        container.register(SchedulerListPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
