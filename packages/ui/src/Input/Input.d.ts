import * as React from "react";
import { TextFieldProps } from "@rmwc/textfield";
import { FormComponentProps } from "./../types";
export declare type InputProps = FormComponentProps & TextFieldProps & {
    rawOnChange: boolean;
    autoFocus?: boolean;
    placeholder?: string;
    description?: string;
    rows?: number;
    box?: string;
    leadingIcon?: React.ReactNode;
    onBlur?: (e: React.SyntheticEvent<HTMLInputElement>) => any;
    className?: string;
};
/**
 * Use Input component to store short string values, like first name, last name, e-mail etc.
 * Additionally, with rows prop, it can also be turned into a text area, to store longer strings.
 */
export declare class Input extends React.Component<InputProps> {
    static defaultProps: {
        rawOnChange: boolean;
        validation: {
            isValid: any;
        };
    };
    static rmwcProps: string[];
    onChange: (e: React.SyntheticEvent<HTMLInputElement, Event>) => void;
    onBlur: (e: React.SyntheticEvent<HTMLInputElement, Event>) => Promise<void>;
    render(): JSX.Element;
}
