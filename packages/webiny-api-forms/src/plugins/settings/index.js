// @flow
import { formsSettingsFactory } from "webiny-api-forms/entities";
import { FileType, FileInputType } from "webiny-api-files/graphql";

export default [
    {
        name: "schema-settings-forms",
        type: "schema-settings",
        namespace: "forms",
        typeDefs: () => [
            FileType,
            FileInputType,
            /* GraphQL */ `
                type FormsSocialMedia {
                    facebook: String
                    twitter: String
                    instagram: String
                    image: File
                }

                type FormsSettings {
                    name: String
                    favicon: File
                    logo: File
                    domain: String
                    social: FormsSocialMedia
                    forms: FormsSettingsForms
                }

                type FormsSettingsResponse {
                    error: Error
                    data: FormsSettings
                }

                type FormsSettingsForms {
                    home: ID
                    notFound: ID
                    error: ID
                }

                type FormsDefaultForm {
                    id: String
                    parent: String
                    title: String
                }

                input FormsSocialMediaInput {
                    facebook: String
                    twitter: String
                    instagram: String
                    image: FileInput
                }

                input FormsDefaultFormInput {
                    id: String
                    title: String
                }

                input FormsSettingsInput {
                    name: String
                    favicon: FileInput
                    logo: FileInput
                    social: FormsSocialMediaInput
                    forms: FormsSettingsFormsInput
                }

                input FormsSettingsFormsInput {
                    home: ID
                    notFound: ID
                    error: ID
                }

                extend type SettingsQuery {
                    forms: FormsSettingsResponse
                }

                extend type SettingsMutation {
                    forms(data: FormsSettingsInput): FormsSettingsResponse
                }
            `
        ],
        entity: ({
            forms: {
                entities: { FormsSettings }
            }
        }: Object) => FormsSettings
    },
    {
        type: "entity",
        name: "entity-forms-settings",
        namespace: "forms",
        entity: {
            name: "FormsSettings",
            factory: formsSettingsFactory
        }
    }
];
