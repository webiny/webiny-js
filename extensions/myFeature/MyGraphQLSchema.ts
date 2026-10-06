import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { staticSchemaKey } from "webiny/api/graphql";
import { MyService } from "@/extensions/myFeature/MyFeature.js";

class MyGraphQLSchema implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("extensions/MyGraphQLSchema");

    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            extend type Query {
                getDemoResponse: String!
            }
        `);

        builder.addResolver({
            path: "Query.getDemoResponse",
            dependencies: [MyService],
            resolver: (myService: MyService.Interface) => {
                return () => {
                    return myService.hello();
                };
            }
        });

        return builder;
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: MyGraphQLSchema,
    dependencies: []
});
