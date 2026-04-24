import React, { useEffect } from "react";
import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import { useRegisterProductionEnvironments } from "~/services/GetProjectConfigService/ProductionEnvironmentsContext.js";

interface RegistrarProps {
    environments: string[];
}

const Registrar: React.FC<RegistrarProps> = ({ environments }) => {
    const setProdEnvs = useRegisterProductionEnvironments();
    useEffect(() => {
        if (setProdEnvs) {
            setProdEnvs(environments);
        }
    }, []);
    return null;
};

export const ProductionEnvironments = defineExtension({
    type: "Infra/ProductionEnvironments",
    tags: { runtimeContext: "project" },
    description: "Provide names for environments that are considered production environments.",
    paramsSchema: z.object({
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
    }),
    render: props => React.createElement(Registrar, { environments: props.environments })
});
