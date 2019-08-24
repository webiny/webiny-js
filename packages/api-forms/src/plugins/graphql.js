// @flow
import { merge } from "lodash";
import { dummyResolver } from "@webiny/api/graphql";
import { hasScope } from "@webiny/api-security";
import gql from "graphql-tag";
import {
    I18NStringValueType,
    I18NJSONValueType,
    I18NStringValueInput,
    I18NJSONValueInput
} from "@webiny/api-i18n/graphql";

import form from "./graphql/form";
import formSubmission from "./graphql/formSubmission";
import formsSettings from "./graphql/formsSettings";

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
            ${formsSettings.typeDefs}
        `,
        resolvers: merge(
            {
                Query: {
                    forms: dummyResolver
                },
                Mutation: {
                    forms: dummyResolver
                }
            },
            form.resolvers,
            formSubmission.resolvers,
            formsSettings.resolvers
        )
    },
    security: {
        shield: {
            FormsQuery: {
                getSettings: hasScope("cms:settings"),
                getForm: hasScope("forms:form:crud"),
                listForms: hasScope("forms:form:crud"),
                listFormSubmissions: hasScope("forms:form:crud")
                // listPublishedForms: hasScope("forms:form:crud") // Expose publicly.
                // getPublishedForms: hasScope("forms:form:crud") // Expose publicly.
            },
            FormsMutation: {
                updateSettings: hasScope("cms:settings"),
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
