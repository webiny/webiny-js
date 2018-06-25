import type { Api, Schema } from "webiny-api";
import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull,
    GraphQLBoolean
} from "graphql";
import GraphQLJSON from "graphql-type-json";

export default () => {
    return {
        init(params: Object, next: Function) {
            const api: Api = params.api;

            api.graphql.schema((schema: Schema) => {
                schema.addType(
                    new GraphQLObjectType({
                        name: "CreateDeploy",
                        fields: {
                            id: { type: GraphQLString },
                            required: { type: new GraphQLList(GraphQLString) }
                        }
                    })
                );

                schema.mutation["createDeploy"] = {
                    description:
                        "Create a deploy, check files digest and return list of required files",
                    type: schema.getType("CreateDeploy"),
                    args: {
                        files: { type: GraphQLJSON }
                    },
                    resolve(root, args) {
                        return {
                            id: "123", // TODO: Create new Deploy
                            required: Object.keys(args.files || {})
                        };
                    }
                };

                schema.mutation["uploadFile"] = {
                    description: "Upload file",
                    type: GraphQLBoolean,
                    args: {
                        deployId: { type: GraphQLNonNull(GraphQLString) },
                        name: { type: GraphQLString },
                        data: { type: GraphQLString }
                    },
                    resolve() {
                        // Forward file to Netlify
                        return true;
                    }
                };
            });

            next();
        }
    };
};
