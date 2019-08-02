// @flow
import { dummyResolver } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";
import {
    I18NStringValueType,
    I18NJSONValueType,
    I18NStringValueInput,
    I18NJSONValueInput
} from "webiny-api-i18n/graphql";

import {
    FileType,
    FileInputType,
    FileListResponseType,
    FileResponseType
} from "webiny-api-files/graphql";

import form from "./graphql/Form";
import formSubmission from "./graphql/FormSubmission";

export default {
    type: "graphql-schema",
    name: "graphql-schema-forms",
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
            SettingsQuery: {
                forms: hasScope("cms:settings")
            },
            SettingsMutation: {
                forms: hasScope("cms:settings")
            },
            FormsQuery: {
                getForm: hasScope("forms:form:crud"),
                listForms: hasScope("forms:form:crud"),
                listFormSubmissions: hasScope("forms:form:crud"),
                // listPublishedForms: hasScope("forms:form:crud") // Expose publicly.
                // getPublishedForms: hasScope("forms:form:crud") // Expose publicly.
            },
            FormsMutation: {
                createForm: hasScope("forms:form:crud"),
                deleteForm: hasScope("forms:form:crud"),
                createRevisionFrom: hasScope("forms:form:revision:create"),
                updateRevision: hasScope("forms:form:revision:update"),
                publishRevision: hasScope("forms:form:revision:publish"),
                unpublishRevision: hasScope("forms:form:revision:unpublish"),
                deleteRevision: hasScope("forms:form:revision:delete"),
                exportFormSubmissions: hasScope("forms:form:submission:export"),
                // saveFormView: hasScope("forms:form:revision:delete") // Expose publicly.
                // createFormSubmission: hasScope("forms:form:revision:delete") // Expose publicly.
            }
        }
    }
};
