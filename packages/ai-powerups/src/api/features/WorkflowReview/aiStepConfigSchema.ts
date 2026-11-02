import { z } from "zod";

/**
 * The stored config of an `ai` step (R164): what the author writes, the model they pick (the full
 * id, `"<providerId>/<modelId>"`, as `Ai` expects) and the tools the step allowlists (R167). It is
 * the step type's `configSchema`, so `listStepTypes` describes it to the editor; `instructions`
 * carries `ui: "textarea"` (R166). `tools` defaults to `[]`: a step with no tools can only decide.
 */
export const aiStepConfigSchema = z.object({
    instructions: z.string().meta({ ui: "textarea" }),
    model: z.string(),
    tools: z.array(z.string()).default([])
});

export type AiStepConfig = z.infer<typeof aiStepConfigSchema>;
