import { merge } from "lodash";
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
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

const emptyResolver = () => ({});

const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    name: "graphql-schema-forms",
    schema: {
        typeDefs: `
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

            type FormCursors {
                next: String
                previous: String
            }

            type FormListMeta {
                cursors: FormCursors
                hasNextPage: Boolean
                hasPreviousPage: Boolean
                totalCount: Int
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
    }
};

export default plugin;
