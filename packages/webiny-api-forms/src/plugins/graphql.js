// @flow
import { dummyResolver } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";
import { FileType, FileInputType } from "webiny-api-files/graphql";

import form from "./graphql/Form";

export default {
    type: "graphql",
    name: "graphql-forms",
    namespace: "forms",
    typeDefs: () => [
        FileType,
        FileInputType,
        `
            type FormsQuery {
                _empty: String
            }   
            
            type FormsMutation {
                _empty: String
            }
            
            type Query {
                forms: FormsQuery
            }
            
            type Mutation {
                forms: FormsMutation
            }
        `,
        form.typeDefs
    ],
    resolvers: () => [
        {
            Query: {
                forms: dummyResolver
            },
            Mutation: {
                forms: dummyResolver
            }
        },
        form.resolvers
    ],
    security: {
        shield: {
            FormsQuery: {
                listForms: hasScope("forms:form:crud")
            },
            FormsMutation: {
                createForm: hasScope("forms:form:crud"),
                deleteForm: hasScope("forms:form:crud"),

                createRevisionFrom: hasScope("forms:form:revision:create"),
                updateRevision: hasScope("forms:form:revision:update"),
                publishRevision: hasScope("forms:form:revision:publish"),
                deleteRevision: hasScope("forms:form:revision:delete")
            }
        }
    }
};
