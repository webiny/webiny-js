import * as React from "react";
import { AutoCompleteBaseProps } from "./types";
export declare type AutoCompleteProps = AutoCompleteBaseProps;
declare type State = {
    inputValue: string;
};
declare class AutoComplete extends React.Component<AutoCompleteProps, State> {
    static defaultProps: {
        valueProp: string;
        textProp: string;
        options: any[];
        renderItem(item: any): JSX.Element;
    };
    state: {
        inputValue: string;
    };
    /**
     * Helps us trigger some of the downshift's methods (eg. clearSelection) and helps us to avoid adding state.
     */
    downshift: any;
    componentDidUpdate(previousProps: any): void;
    /**
     * Renders options - based on user's input. It will try to match input text with available options.
     */
    renderOptions({ options, isOpen, highlightedIndex, selectedItem, getMenuProps, getItemProps }: any): JSX.Element;
    render(): JSX.Element;
}
export { AutoComplete };
