import * as React from "react";
import { AutoCompleteBaseProps } from "./types";
export declare type MultiAutoCompleteProps = AutoCompleteBaseProps & {
    /**
     * Prevents adding the same item to the list twice.
     */
    unique: boolean;
    /**
     * Set if custom values (not from list of suggestions) are allowed.
     */
    allowFreeInput?: boolean;
};
declare type State = {
    inputValue: string;
};
export declare class MultiAutoComplete extends React.Component<MultiAutoCompleteProps, State> {
    static defaultProps: {
        valueProp: string;
        textProp: string;
        unique: boolean;
        options: any[];
        useSimpleValues: boolean;
        renderItem(item: any): JSX.Element;
    };
    state: {
        inputValue: string;
    };
    /**
     * Helps us trigger some of the downshift's methods (eg. clearSelection) and helps us to avoid adding state.
     */
    downshift: any;
    assignedValueAfterClearing: {
        set: boolean;
        selection: any;
    };
    getOptions(): any[];
    /**
     * Renders options - based on user's input. It will try to match input text with available options.
     * @param options
     * @param isOpen
     * @param highlightedIndex
     * @param selectedItem
     * @param getMenuProps
     * @param getItemProps
     * @returns {*}
     */
    renderOptions({ options, isOpen, highlightedIndex, getMenuProps, getItemProps }: any): JSX.Element;
    /**
     * Once added, items can also be removed by clicking on the ✕ icon. This is the method that is responsible for
     * rendering selected items (we are using already existing "Chips" component).
     * @returns {*}
     */
    renderMultipleSelection(): JSX.Element;
    render(): JSX.Element;
}
export {};
