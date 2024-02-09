export const GET_PUBLISHED_FORM = /* GraphQL */ `
    query FbGetPublishedForm($formId: ID) @ps(cache: true) {
        formBuilder {
            getPublishedForm(formId: $formId) {
                data {
                    id
                    formId
                    fields {
                        _id
                        fieldId
                        type
                        label
                        placeholderText
                        helpText
                        options {
                            label
                            value
                        }
                        validation {
                            name
                            settings
                            message
                        }
                        settings
                    }
                    steps {
                        title
                        layout
                    }
                    triggers
                    settings {
                        reCaptcha {
                            enabled
                            errorMessage
                            settings {
                                enabled
                                siteKey
                                secretKey
                            }
                        }
                        layout {
                            renderer
                        }
                        successMessage
                        submitButtonLabel
                        fullWidthSubmitButton
                        termsOfServiceMessage {
                            enabled
                            message
                            errorMessage
                        }
                    }
                }
                error {
                    message
                }
            }
        }
    }
`;

export const LOG_FORM_VIEW = /* GraphQL */ `
    mutation SaveFormView($revision: ID!) {
        formBuilder {
            saveFormView(revision: $revision) {
                error {
                    message
                }
            }
        }
    }
`;

export const CREATE_FORM_SUBMISSION = /* GraphQL */ `
    mutation CreateFormSubmission(
        $revision: ID!
        $data: JSON!
        $meta: JSON!
        $reCaptchaResponseToken: String
    ) {
        formBuilder {
            createFormSubmission(
                revision: $revision
                data: $data
                meta: $meta
                reCaptchaResponseToken: $reCaptchaResponseToken
            ) {
                error {
                    message
                    data
                }
            }
        }
    }
`;
