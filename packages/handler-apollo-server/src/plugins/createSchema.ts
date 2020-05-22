import { createSchema } from "@webiny/graphql";

export default {
    type: "handler-apollo-server-create-schema",
    name: "handler-apollo-server-create-schema",
    create: createSchema
};
