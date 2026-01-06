import { createFeature } from "@webiny/feature/admin";
import { WidgetPresenter } from "./WidgetPresenter.js";
import { AiPrompt } from "../../features/aiPrompt/abstractions.js";

export const AiTextWriterWidgetFeature = createFeature({
    name: "AiTextWriterWidget",
    register() {},
    resolve(container) {
        return {
            presenter: container.resolveWithDependencies({
                implementation: WidgetPresenter,
                dependencies: [AiPrompt]
            })
        };
    }
});
