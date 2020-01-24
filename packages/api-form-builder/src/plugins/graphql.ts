import { merge } from "lodash";
import { emptyResolver } from "@webiny/api";
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
import { install, isInstalled } from "./graphql/install";
import { GraphQLSchemaPlugin } from "@webiny/api/types";

const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    name: "graphql-schema-forms",
    schema: {
        typeDefs: gql`
            ${I18NStringValueType()}
            ${I18NJSONValueType()}
            ${I18NStringValueInput()}
            ${I18NJSONValueInput()}

            type FormsBooleanResponse {
                data: Boolean
                error: FormError
            }

            type FormsQuery {
                # Is Form Builder installed?
                isInstalled: FormsBooleanResponse
            }

            type FormsMutation {
                # Install Form Builder
                install(domain: String): FormsBooleanResponse
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
                    forms: emptyResolver
                },
                Mutation: {
                    forms: emptyResolver
                },
                FormsQuery: { isInstalled },
                FormsMutation: { install }
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

export default plugin;
