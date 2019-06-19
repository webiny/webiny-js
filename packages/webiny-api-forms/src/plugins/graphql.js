// @flow
import { dummyResolver } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";
import {
    I18NStringValueType,
    I18NJSONValueType,
    I18NStringValueInput,
    I18NJSONValueInput
} from "webiny-api-forms/__i18n/graphql";

import {
    FileType,
    FileInputType,
    FileListResponseType,
    FileResponseType
} from "webiny-api-files/graphql";

import form from "./graphql/Form";
import formSubmission from "./graphql/FormSubmissions";

export default {
    type: "graphql-schema",
    name: "graphql-forms",
    namespace: "forms",
    schema: {
        typeDefs: () => [
            I18NStringValueType,
            I18NJSONValueType,
            I18NStringValueInput,
            I18NJSONValueInput,
            FileType,
            FileInputType,
            FileListResponseType,
            FileResponseType,
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
            }`,
            form.typeDefs,
            formSubmission.typeDefs
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
            form.resolvers,
            formSubmission.resolvers
        ]
    },
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
