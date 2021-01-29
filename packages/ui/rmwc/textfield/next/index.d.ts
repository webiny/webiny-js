/* eslint-disable */
import * as RMWC from '@rmwc/types';
import * as React from 'react';
import { IconProps } from '@rmwc/icon';
import { SpecificEventListener } from '@material/base/types';
import { MDCTextFieldFoundation, MDCTextFieldIconFoundation, MDCTextFieldCharacterCounterFoundation } from '@material/textfield';
import { FoundationComponent } from '@rmwc/base';
/*********************************************************************
 * TextField
 *********************************************************************/
/** A TextField component for accepting text input from a user. */
export interface TextFieldProps {
    /** Sets the value for controlled TextFields. */
    value?: string | number;
    /** Adds help text to the field */
    helpText?: React.ReactNode | TextFieldHelperTextProps;
    /** Shows the character count, must be used in conjunction with maxLength. */
    characterCount?: boolean;
    /** Makes the TextField visually invalid. This is sometimes automatically applied in cases where required or pattern is used.  */
    invalid?: boolean;
    /** Makes the Textfield disabled.  */
    disabled?: boolean;
    /** Makes the Textfield required.  */
    required?: boolean;
    /** Outline the TextField */
    outlined?: boolean;
    /** A label for the input. */
    label?: React.ReactNode;
    /** Makes a multiline TextField. */
    textarea?: boolean;
    /** Makes the TextField fullwidth. */
    fullwidth?: boolean;
    /** Add a leading icon. */
    icon?: RMWC.IconPropT;
    /** Add a trailing icon. */
    trailingIcon?: RMWC.IconPropT;
    /** By default, props spread to the input. These props are for the component's root container. */
    rootProps?: Object;
    /** A reference to the native input or textarea. */
    inputRef?: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null> | ((ref: HTMLInputElement | HTMLTextAreaElement | null) => void);
    /** The type of input field to render, search, number, etc */
    type?: string;
}
export interface DeprecatedTextfieldProps {
    /** DEPRECATED: Is being removed from MCW. */
    dense?: boolean;
    /** DEPRECATED: Use icon. */
    withLeadingIcon?: RMWC.IconPropT;
    /** DEPRECATED: Use trailingIcon. */
    withTrailingIcon?: RMWC.IconPropT;
}
/** A TextField component for accepting text input from a user. */
export declare class TextField extends FoundationComponent<MDCTextFieldFoundation, TextFieldProps & DeprecatedTextfieldProps> {
    static displayName: string;
    generatedId: string;
    private root;
    private input;
    private label;
    private lineRipple;
    characterCounter?: null | TextFieldCharacterCount;
    leadingIcon: null | TextFieldIcon;
    trailingIcon: null | TextFieldIcon;
    outline: null | any;
    valueNeedsUpdate: boolean;
    constructor(props: any);
    getDefaultFoundation(): MDCTextFieldFoundation;
    getLabelAdapterMethods(): {
        shakeLabel: (shouldShake: boolean) => void;
        floatLabel: (shouldFloat: boolean) => void;
        hasLabel: () => boolean;
        getLabelWidth: () => number;
    };
    getLineRippleAdapterMethods(): {
        activateLineRipple: () => void;
        deactivateLineRipple: () => void;
        setLineRippleTransformOrigin: (normalizedX: number) => void;
    };
    getOutlineAdapterMethods(): {
        notchOutline: (labelWidth: number) => void;
        closeOutline: () => any;
        hasOutline: () => boolean;
    };
    getInputAdapterMethods(): {
        registerInputInteractionHandler: <K extends any>(evtType: K, handler: SpecificEventListener<any>) => void;
        deregisterInputInteractionHandler: <K extends any>(evtType: K, handler: SpecificEventListener<any>) => void;
        getNativeInput: () => (HTMLInputElement & HTMLTextAreaElement) | null;
    };
    getFoundationMap(): {
        characterCounter: MDCTextFieldCharacterCounterFoundation | undefined;
        helperText: undefined;
        leadingIcon: MDCTextFieldIconFoundation | undefined;
        trailingIcon: MDCTextFieldIconFoundation | undefined;
    };
    renderIcon(icon: RMWC.IconPropT, leadOrTrail: 'leadingIcon' | 'trailingIcon'): JSX.Element;
    sync(props: TextFieldProps): void;
    handleOnChange(evt: React.ChangeEvent<HTMLInputElement>): void;
    renderHelpText(renderedCharacterCounter?: React.ReactNode): JSX.Element | null;
    render(): JSX.Element;
}
/*********************************************************************
 * Helper Text
 *********************************************************************/
interface TextFieldHelperCharacterCount {
}
declare class TextFieldCharacterCount extends FoundationComponent<MDCTextFieldCharacterCounterFoundation, TextFieldHelperCharacterCount> {
    static displayName: string;
    state: {
        content: string;
    };
    getDefaultFoundation(): MDCTextFieldCharacterCounterFoundation;
    render(): JSX.Element;
}
export interface TextFieldHelperTextProps {
    /** Make the help text always visible */
    persistent?: boolean;
    /** Make the help a validation message style */
    validationMsg?: boolean;
    /** Content for the help text */
    children: React.ReactNode;
}
/** A help text component */
export declare const TextFieldHelperText: React.ComponentType<RMWC.MergeInterfacesT<TextFieldHelperTextProps, RMWC.ComponentProps>>;
/*********************************************************************
 * Icon
 *********************************************************************/
/**
 * An Icon in a TextField
 */
export declare class TextFieldIcon extends FoundationComponent<MDCTextFieldIconFoundation, IconProps> {
    static displayName: string;
    private root;
    getDefaultFoundation(): MDCTextFieldIconFoundation;
    render(): JSX.Element;
}
export {};
