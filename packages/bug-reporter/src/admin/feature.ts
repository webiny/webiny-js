import { createFeature } from "@webiny/feature/admin";
import { ActionRecorder as ActionRecorderAbstraction } from "./recording/abstractions.js";
import { ActionRecorder } from "./recording/ActionRecorder.js";
import { SubmitBugReportGateway } from "./gateway/SubmitBugReportGateway.js";
import { ReportBugPresenter as ReportBugPresenterAbstraction } from "./presentation/report/abstractions.js";
import { ReportBugPresenter } from "./presentation/report/ReportBugPresenter.js";
import { ReportBugCommand } from "./commands/ReportBugCommand.js";

export const BugReportFeature = createFeature({
    name: "BugReport",
    register(container) {
        // Singletons: the recorder's buffer and the dialog state both have to outlive renders.
        container.register(ActionRecorder).inSingletonScope();
        container.register(ReportBugPresenter).inSingletonScope();

        container.register(SubmitBugReportGateway);
        container.register(ReportBugCommand);
    },
    resolve(container) {
        return {
            recorder: container.resolve(ActionRecorderAbstraction),
            report: container.resolve(ReportBugPresenterAbstraction)
        };
    }
});
