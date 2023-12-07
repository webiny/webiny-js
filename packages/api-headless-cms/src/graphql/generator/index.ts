import { codegen } from "@graphql-codegen/core";
import { getCachedDocumentNodeFromSchema } from "@graphql-codegen/plugin-helpers";
import * as typedDocumentNode from "@graphql-codegen/typed-document-node";
import * as typescript from "@graphql-codegen/typescript";
import * as typescriptOperations from "@graphql-codegen/typescript-operations";
import { ApiEndpoint, CmsContext } from "~/types";
import { Reply, Request } from "@webiny/handler/types";
import { getSchema } from "~/graphql/getSchema";
import prettier from "prettier";

interface Params {
    context: CmsContext;
    request: Request;
    reply: Reply;
}

export const handleSchemaGeneratorRequest = async (params: Params) => {
    const { context, reply } = params;
    const config: typescript.TypeScriptPluginConfig &
        typescriptOperations.TypeScriptDocumentsPluginConfig &
        typedDocumentNode.TypeScriptTypedDocumentNodesConfig = {
        useTypeImports: true
    };
    const getTenant = () => {
        return context.tenancy.getCurrentTenant();
    };

    const getLocale = () => {
        return context.cms.getLocale();
    };

    const schema = await getSchema({
        context,
        getTenant,
        getLocale,
        type: context.cms.type as ApiEndpoint
    });

    const schemaAsDocumentNode = getCachedDocumentNodeFromSchema(schema);

    const codegenCode = await codegen({
        schema: schemaAsDocumentNode,
        schemaAst: schema,
        config,
        documents: [],
        filename: "gql.generated.ts",
        pluginMap: {
            typescript,
            typescriptOperations,
            typedDocumentNode
        },
        plugins: [
            {
                typescript: {}
            },
            {
                typescriptOperations: {}
            },
            {
                typedDocumentNode: {}
            }
        ]
    });
    return reply.send(
        prettier.format(codegenCode, {
            ...(await prettier.resolveConfig(process.cwd())),
            parser: "typescript"
        })
    );
};
