import { createFeature } from "@webiny/feature/api";
import { AiStepRunner } from "./AiStepRunner.js";

/** The `StepRunner` for `ai` steps. Registered by `Extension.ts` inside the combined gate (R177, R178). */
export const AiStepRunnerFeature = createFeature({
    name: "AiPowerUps/AiStepRunner",
    register(container) {
        container.register(AiStepRunner);
    }
});
