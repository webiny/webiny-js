import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { openSearchParamsSchema, PulumiOpenSearch } from "@webiny/project/extensions/aws/index.js";
import { createPathResolver } from "@webiny/project";
import {
    CoreBeforeDeploy,
    ProjectDecorator,
    DatabaseSetup
} from "@webiny/project/extensions/index.js";

const p = createPathResolver(import.meta.dirname, "OpenSearch");

export const OpenSearch = defineExtension({
    type: "Project/OpenSearch",
    tags: { runtimeContext: "project" },
    description: "Enable and configure Opensearch integration with project-level setup.",
    paramsSchema: openSearchParamsSchema,
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
                        <CoreBeforeDeploy src={p("EnsureOsServiceRoleBeforeCoreDeploy.js")} />
                        <CoreBeforeDeploy src={p("EnsureOsWasDeployed.js")} />
                    </>
                )}
            </>
        );
    }
});
