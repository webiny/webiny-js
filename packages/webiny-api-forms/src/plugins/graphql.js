// @flow
import { merge } from "lodash";
import { dummyResolver } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";
import { FileType } from "webiny-api-files/graphql";
import gql from "graphql-tag";
import {
    I18NStringValueType,
    I18NJSONValueType,
    I18NStringValueInput,
    I18NJSONValueInput
} from "webiny-api-i18n/graphql";

import form from "./graphql/Form";
import formSubmission from "./graphql/FormSubmission";

export default {
    type: "graphql-schema",
    name: "graphql-schema-forms",
    namespace: "forms",
    schema: {
        typeDefs: gql`    
            ${I18NStringValueType("")}
            ${I18NJSONValueType("")}
            ${I18NStringValueInput("")}
            ${I18NJSONValueInput("")}

            type FormsQuery {
                _empty: String
            }

            type FormsMutation {
                _empty: String
            }

            extend type Query {
                forms: FormsQuery
            }

            extend type Mutation {
                forms: FormsMutation
            }

            type FormError {
                code: String
                message: String
                data: JSON
            }

            type FormListMeta {
                totalCount: Int
                totalPages: Int
                page: Int
                perPage: Int
                from: Int
                to: Int
                previousPage: Int
                nextPage: Int
            }

            type FormDeleteResponse {
                data: Boolean
                error: FormError
            }

            ${form.typeDefs}
            ${formSubmission.typeDefs}
        `,
        resolvers: merge(
            {
                Query: {
                    i18n: dummyResolver,
                    forms: dummyResolver
                },
                Mutation: {
                    i18n: dummyResolver,
                    forms: dummyResolver
                }
            },
            form.resolvers,
            formSubmission.resolvers
        )
    },
    security: {
        shield: {
            // TODO: move settings into its own fields
            /*SettingsQuery: {
                forms: hasScope("cms:settings")
            },
            SettingsMutation: {
                forms: hasScope("cms:settings")
            },*/
            FormsQuery: {
                getForm: hasScope("forms:form:crud"),
                listForms: hasScope("forms:form:crud"),
                listFormSubmissions: hasScope("forms:form:crud")
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
                exportFormSubmissions: hasScope("forms:form:submission:export")
                // saveFormView: hasScope("forms:form:revision:delete") // Expose publicly.
                // createFormSubmission: hasScope("forms:form:revision:delete") // Expose publicly.
            }
        }
    }
};
