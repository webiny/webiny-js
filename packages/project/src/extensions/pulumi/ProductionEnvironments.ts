import { defineExtension } from "~/defineExtension/index.js";

export const ProductionEnvironments = defineExtension({
    type: "Infra/ProductionEnvironments",
    tags: { runtimeContext: "project" },
    description: "Provide names for environments that are considered production environments.",
    multiple: true,
    paramsSchema: ({ z }) => ({
        environments: z.array(
            z.string().superRefine((value, ctx) => {
                if (!value) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Environment name cannot be empty."
                    });
                    return;
                }

                // Must allow only letters, numbers, dashes, and underscores.
                if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message:
                            "Environment name can only contain letters, numbers, dashes, and underscores."
                    });
                }
            })
        )
    })
});
