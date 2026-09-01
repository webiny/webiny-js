import { createFeature } from "@webiny/feature/admin";
import { ScheduleDialogPresenter as PresenterAbstraction } from "./abstractions.js";
import { ScheduleDialogPresenter } from "./ScheduleDialogPresenter.js";

export const ScheduleDialogPresenterFeature = createFeature({
    name: "Scheduler/ScheduleDialogPresenter",
    register(container) {
        container.register(ScheduleDialogPresenter);
    },
    resolve(container) {
        return { presenter: container.resolve(PresenterAbstraction) };
    }
});
