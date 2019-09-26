// @flow
import { gql } from "apollo-server-lambda";
import { buildFederatedSchema } from "@apollo/federation";
import GraphQLJSON from "graphql-type-json";
import { GraphQLDateTime } from "graphql-iso-date";
import GraphQLLong from "graphql-type-long";
import { RefInput } from "./RefInputScalar";
import type { PluginsContainerType } from "../types";

type PrepareSchemaParamsType = { config: Object, plugins: PluginsContainerType };

/**
 * @return {schema, context}
 */
export async function prepareSchema({ config, plugins }: PrepareSchemaParamsType) {
    // This allows developers to register more plugins dynamically, before the graphql schema is instantiated.
    const gqlPlugins = plugins.byType("graphql-schema");

    for (let i = 0; i < gqlPlugins.length; i++) {
        if (typeof gqlPlugins[i].prepare === "function") {
            await gqlPlugins[i].prepare({ plugins, config });
        }
    }

    const scalars = plugins.byType("graphql-scalar").map(item => item.scalar);

    const schemaDefs = [
        {
            typeDefs: gql`
                ${scalars.map(scalar => `scalar ${scalar.name}`).join(" ")}
                scalar JSON
                scalar Long
                scalar DateTime
                scalar RefInput
                scalar I18N
            `,
            resolvers: {
                ...scalars,
                JSON: GraphQLJSON,
                DateTime: GraphQLDateTime,
                Long: GraphQLLong,
                RefInput
            }
        }
    ];

    // Fetch schema plugins again, in case there were new plugins registered in the meantime.
    const schemaPlugins = plugins.byType("graphql-schema");
    for (let i = 0; i < schemaPlugins.length; i++) {
        const { schema } = schemaPlugins[i];
        if (!schema) {
            continue;
        }

        if (typeof schema === "function") {
            schemaDefs.push(await schema({ config, plugins }));
        } else {
            schemaDefs.push(schema);
        }
    }

    return buildFederatedSchema([...schemaDefs]);
}
