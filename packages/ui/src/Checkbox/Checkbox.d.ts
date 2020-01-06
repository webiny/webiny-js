import * as React from "react";
import { FormComponentProps } from "./../types";
declare type Props = FormComponentProps & {
    label?: string;
    disabled?: boolean;
    onClick?: Function;
    indeterminate?: boolean;
    description?: string;
};
/**
 * Single Checkbox component can be used to store simple boolean values.
 *
 * Grouping multiple Checkbox components with CheckboxGroup will allow to store an array of selected values.
 * In that case, each Checkbox component must receive value and onChange callback via props.
 */
declare class Checkbox extends React.Component<Props> {
    static defaultProps: {
        validation: {
            isValid: any;
        };
    };
    onChange: (e: React.SyntheticEvent<HTMLInputElement, Event>) => void;
    render(): JSX.Element;
}
export default Checkbox;
