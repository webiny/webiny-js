import * as React from "react";
import { SwitchProps } from "@rmwc/switch";
import { FormComponentProps } from "./../types";
declare type Props = FormComponentProps & SwitchProps & {
    description?: string;
    className?: string;
};
/**
 * Switch component can be used to store simple boolean values.
 */
declare class Switch extends React.Component<Props> {
    static defaultProps: {
        validation: {
            isValid: any;
        };
    };
    static rmwcProps: string[];
    onChange: (e: React.SyntheticEvent<HTMLElement, Event>) => void;
    render(): JSX.Element;
}
export { Switch };
