import * as React from "react";
declare type Props = {
    flat?: boolean;
    small?: boolean;
    onClick?: (event: React.MouseEvent<any, MouseEvent>) => void | null;
    children?: React.ReactNode;
    ripple?: boolean;
    className?: string;
    disabled?: boolean;
    style?: {
        [key: string]: any;
    };
};
/**
 * Shows a default button, used typically when action is not of high priority.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ButtonDefault: (props: Props) => JSX.Element;
/**
 * Shows primary button, eg. for submitting forms.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ButtonPrimary: (props: Props) => JSX.Element;
/**
 * Shows a secondary button - eg. for doing a reset on a form.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ButtonSecondary: (props: Props) => JSX.Element;
declare type ButtonFloatingProps = Props & {
    label?: React.ReactNode;
    icon?: React.ReactNode;
};
/**
 * A floating button, shown on the side of the screen, typically used for creating new content or accessing settings.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ButtonFloating: (props: ButtonFloatingProps) => JSX.Element;
/**
 * Shows an icon, suitable to be shown inside of a button.
 * @param props
 * @returns {*}
 * @constructor
 */
export declare const ButtonIcon: (props: any) => JSX.Element;
export {};
