import { createFeature } from "webiny/admin";
import { ActionRecorder as ActionRecorderAbstraction } from "./recording/abstractions.js";
import { ActionRecorder } from "./recording/ActionRecorder.js";
import { BugReportSettings } from "./settings/BugReportSettings.js";
import { GitHubGateway } from "./github/GitHubGateway.js";
import { IssueDrafter } from "./ai/IssueDrafter.js";
import { SpeechDictation } from "./speech/SpeechDictation.js";
import { ReportBugPresenter as ReportBugPresenterAbstraction } from "./presentation/report/abstractions.js";
import { ReportBugPresenter } from "./presentation/report/ReportBugPresenter.js";
import { BugReportSettingsPresenter as SettingsPresenterAbstraction } from "./presentation/settings/abstractions.js";
import { BugReportSettingsPresenter } from "./presentation/settings/BugReportSettingsPresenter.js";
import { ReportBugCommand } from "./commands/ReportBugCommand.js";
import { BugReportSettingsCommand } from "./commands/BugReportSettingsCommand.js";

export const BugReportFeature = createFeature({
    name: "BugReport",
    register(container) {
        // Singletons: the recorder's buffer and the dialog state both have to outlive renders.
        container.register(ActionRecorder).inSingletonScope();
        container.register(BugReportSettings).inSingletonScope();
        container.register(SpeechDictation).inSingletonScope();
        container.register(BugReportSettingsPresenter).inSingletonScope();
        container.register(ReportBugPresenter).inSingletonScope();

        container.register(GitHubGateway);
        container.register(IssueDrafter);
        container.register(ReportBugCommand);
        container.register(BugReportSettingsCommand);
    },
    resolve(container) {
        return {
            recorder: container.resolve(ActionRecorderAbstraction),
            report: container.resolve(ReportBugPresenterAbstraction),
            settings: container.resolve(SettingsPresenterAbstraction)
        };
    }
});
