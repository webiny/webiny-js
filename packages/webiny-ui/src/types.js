// @flow
export type FormComponentProps = {
    validation?: {
        /* Is checkbox value valid? */
        isValid: null | boolean,
        /* Error message if checkbox is not valid. */
        message: null | string,
        /* Any validation result returned by the validator. */
        results: mixed
    },

    /* Provided by <Form> component to perform validation when value has changed. */
    validate?: () => Promise<mixed>,

    /* Form component's value. */
    value?: any,

    /* A callback that is executed each time a value is changed. */
    onChange?: (value: any) => void
};
