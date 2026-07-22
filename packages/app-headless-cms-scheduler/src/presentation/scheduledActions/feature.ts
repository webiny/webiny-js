import { createFeature } from "@webiny/feature/admin";
import { ScheduledActionsPresenter as Abstraction } from "./abstractions.js";
import { ScheduledActionsPresenter } from "./ScheduledActionsPresenter.js";
import { ContentEntriesPresenterSchedulingDecorator } from "./ContentEntriesPresenterDecorator.js";

export const ScheduledActionsPresenterFeature = createFeature({
    name: "Scheduler/ScheduledActionsPresenter",
    register(container) {
        container.register(ScheduledActionsPresenter).inSingletonScope();
        container.registerDecorator(ContentEntriesPresenterSchedulingDecorator);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
