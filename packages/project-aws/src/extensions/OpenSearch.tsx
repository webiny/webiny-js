import React from "react";
import { OpenSearch as PulumiOpenSearch } from "~/pulumi/extensions/index.js";
import { Infra } from "~/index.js";
import { createPathResolver } from "@webiny/project";
import { ProjectDecorator, DatabaseSetup } from "@webiny/project/extensions/index.js";

const p = createPathResolver(import.meta.dirname, "OpenSearch");

export const OpenSearch = (props: React.ComponentProps<typeof PulumiOpenSearch.ReactComponent>) => {
    return (
        <>
            <PulumiOpenSearch.ReactComponent {...props} />
            {props.enabled && (
                <>
                    {/* Override database setup to indicate OpenSearch is enabled */}
                    <DatabaseSetup.ReactComponent setupName="ddb+os" />

                    <ProjectDecorator.ReactComponent src={p("InjectDdbEsLambdaFnHandler.js")} />
                    <ProjectDecorator.ReactComponent src={p("ReplaceApiLambdaFnHandlers.js")} />
                    <Infra.Core.BeforeDeploy src={p("EnsureOsServiceRoleBeforeCoreDeploy.js")} />
                    <Infra.Core.BeforeDeploy src={p("EnsureOsWasDeployed.js")} />
                </>
            )}
        </>
    );
};
