import React from "react";
import { ElasticSearch as PulumiElasticSearch } from "~/pulumi/extensions/index.js";
import { Infra } from "~/index.js";
import { createPathResolver } from "@webiny/project";
import { ProjectDecorator } from "@webiny/project/extensions/index.js";

const p = createPathResolver(import.meta.dirname, "ElasticSearch");

export const ElasticSearch = (
    props: React.ComponentProps<typeof PulumiElasticSearch.ReactComponent>
) => {
    return (
        <>
            <PulumiElasticSearch.ReactComponent {...props} />
            {props.enabled && (
                <>
                    <ProjectDecorator.ReactComponent src={p("InjectDdbEsLambdaFnHandler.js")} />
                    <ProjectDecorator.ReactComponent src={p("ReplaceApiLambdaFnHandlers.js")} />
                    <Infra.Core.BeforeDeploy src={p("EnsureEsWasDeployed.ts")} />
                    <Infra.Core.BeforeDeploy src={p("EnsureEsServiceRoleBeforeCoreDeploy.js")} />
                </>
            )}
        </>
    );
};
