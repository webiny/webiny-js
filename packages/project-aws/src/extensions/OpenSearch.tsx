import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { OpenSearch as PulumiOpenSearch } from "~/pulumi/extensions/index.js";
import { Infra } from "~/index.js";
import { createPathResolver } from "@webiny/project";
import { ProjectDecorator, DatabaseSetup } from "@webiny/project/extensions/index.js";
import { z } from "zod";

const p = createPathResolver(import.meta.dirname, "OpenSearch");

export const OpenSearch = defineExtension({
    type: "Project/OpenSearch",
    tags: { runtimeContext: "project" },
    description: "Enable and configure Opensearch integration with project-level setup.",
    paramsSchema: z.object({
        enabled: z.boolean().describe("Whether to enable OpenSearch.").default(false).optional(),
        domainName: z.string().describe("The name of the Opensearch domain.").optional(),
        indexPrefix: z
            .string()
            .describe("A prefix to be added to all Opensearch indexes.")
            .optional(),
        sharedIndexes: z
            .boolean()
            .describe(
                "Whether to use shared indexes across all environments (true) or separate indexes per environment (false)."
            )
            .default(false)
            .optional()
    }),
    render: props => {
        return (
            <>
                <PulumiOpenSearch {...props} />
                {props.enabled && (
                    <>
                        {/* Override database setup to indicate OpenSearch is enabled. */}
                        <DatabaseSetup setupName="ddb+os" />
                        <ProjectDecorator src={p("InjectDdbEsLambdaFnHandler.js")} />
                        <ProjectDecorator src={p("ReplaceApiLambdaFnHandlers.js")} />
                        <Infra.Core.BeforeDeploy
                            src={p("EnsureOsServiceRoleBeforeCoreDeploy.js")}
                        />
                        <Infra.Core.BeforeDeploy src={p("EnsureOsWasDeployed.js")} />
                    </>
                )}
            </>
        );
    }
});
