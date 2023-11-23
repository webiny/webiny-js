/**
 * Creates default settings values for form.
 */
export const createFormSettings = () => {
    return {
        layout: {
            renderer: "default"
        },
        submitButtonLabel: null,
        fullWidthSubmitButton: null,
        successMessage: null,
        termsOfServiceMessage: null,
        reCaptcha: {
            enabled: null,
            errorMessage: "Please verify that you are not a robot.",
            settings: {
                enabled: null,
                siteKey: null,
                secretKey: null
            }
        }
    };
};
