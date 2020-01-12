import gql from "graphql-tag";
import { buildFederatedSchema } from "@apollo/federation";
import GraphQLJSON from "graphql-type-json";
import { GraphQLDateTime } from "graphql-iso-date";
import GraphQLLong from "graphql-type-long";
import { RefInput } from "./RefInputScalar";
import {
    PluginsContainer,
    GraphQLSchemaPlugin,
    GraphqlScalarPlugin,
    SchemaDefinition
} from "../types";

type PrepareSchemaParams = { plugins: PluginsContainer };

/**
 * @return {schema, context}
 */
export async function prepareSchema({ plugins }: PrepareSchemaParams) {
    // This allows developers to register more plugins dynamically, before the graphql schema is instantiated.
    const gqlPlugins = plugins.byType<GraphQLSchemaPlugin>("graphql-schema");

    for (let i = 0; i < gqlPlugins.length; i++) {
        if (typeof gqlPlugins[i].prepare === "function") {
            await gqlPlugins[i].prepare({ plugins });
        }
    }

    const scalars = plugins
        .byType<GraphqlScalarPlugin>("graphql-scalar")
        .map(item => item.scalar);

    const schemaDefs: SchemaDefinition[] = [
        {
            typeDefs: gql`
                ${scalars.map(scalar => `scalar ${scalar.name}`).join(" ")}
                scalar JSON
                scalar Long
                scalar DateTime
                scalar RefInput
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
    const schemaPlugins = plugins.byType<GraphQLSchemaPlugin>("graphql-schema");
    for (let i = 0; i < schemaPlugins.length; i++) {
        const { schema } = schemaPlugins[i];
        if (!schema) {
            continue;
        }

        if (typeof schema === "function") {
            schemaDefs.push(await schema({ plugins }));
        } else {
            schemaDefs.push(schema);
        }
    }

    // @ts-ignore
    return buildFederatedSchema([...schemaDefs]);
}
