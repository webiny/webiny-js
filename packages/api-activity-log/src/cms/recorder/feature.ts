import { type Container, createFeature } from "@webiny/feature/api";
import { ActivitySourceResolver } from "./ActivitySourceResolver.js";
import { ActivityWriter } from "./ActivityWriter.js";
import { EntryActivityRecorder } from "./EntryActivityRecorder.js";

export const RecorderFeature = createFeature({
    name: "ActivityLog/Recorder",
    register(container: Container) {
        container.register(ActivitySourceResolver).inSingletonScope();
        container.register(ActivityWriter).inSingletonScope();
        container.register(EntryActivityRecorder).inSingletonScope();
    }
});
