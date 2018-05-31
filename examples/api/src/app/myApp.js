import { GraphQLString } from "graphql";

export default () => {
    return {
        init({ app }, next) {
            app.graphql.schema(schema => {
                schema.query["sendInvoiceToUser"] = {
                    description: "Send email with invoice in the attachment",
                    type: GraphQLString,
                    args: {
                        id: { type: GraphQLString }
                    },
                    resolve() {
                        return "email was sent";
                    }
                };
            });

            next();
        }
    };
};
