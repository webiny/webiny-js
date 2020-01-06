export declare type FormComponentProps = {
    validation?: {
        isValid: null | boolean;
        message: null | string;
        results: any;
    };
    validate?: () => Promise<any>;
    value?: any;
    onChange?: (value: any) => void;
};
