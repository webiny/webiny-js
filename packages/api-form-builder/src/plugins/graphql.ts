import { merge } from "lodash";
import { emptyResolver } from "@webiny/graphql";
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
import { GraphQLSchemaPlugin } from "@webiny/graphql/types";

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
    }
};

export default plugin;
