export type FormComponentProps = {
    validation?: {
        /* Is form element's value valid? */
        isValid: boolean;
        /* Error message if value is not valid. */
        message: string;
        /* Any validation result returned by the validator. */
        results?: { [key: string]: any };
    };

    /* Provided by <Form> component to perform validation when value has changed. */
    validate?: () => Promise<boolean | any>;

    /* Form component's value. */
    value?: any;

    /* A callback that is executed each time a value is changed. */
    onChange?: (value: any) => void;
};
