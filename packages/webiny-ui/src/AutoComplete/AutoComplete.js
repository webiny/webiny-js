// @flow
import * as React from "react";
import Downshift from "downshift";
import { Input } from "webiny-ui/Input";
import { Chips, Chip, ChipText, ChipIcon } from "webiny-ui/Chips";
import type { FormComponentProps } from "./../types";
import { ReactComponent as BaselineCloseIcon } from "./icons/baseline-close-24px.svg";
import { css } from "emotion";
import classNames from "classnames";
import { Elevation } from "webiny-ui/Elevation";
import { Typography } from "webiny-ui/Typography";
import keycode from "keycode";

type Option = any;
type Options = Array<Option>;

type RenderPropParams = {
    renderOptions: Options => React.Node,
    query: string
};

type Props = FormComponentProps & {
    // Component label.
    label?: string,

    // Is checkbox disabled?
    disabled?: boolean,

    // Options that will be shown.
    options: Array<any>,

    // Options that will be shown.
    children?: RenderPropParams => Options,

    // Description beneath the autoComplete.
    description?: string,

    // Placeholder text for the form control. Set to a blank string to create a non-floating placeholder label.
    placeholder?: string,

    // A className for the root element.
    className?: string,

    // Default structure of value, an object consisting of "id" and "name" keys. Different keys can be set using "valueProp" and "textProp" props.
    value?: { id: string, name: string },

    // Key in a single option object that will be used as option's value (by default, "id" key will be used).
    valueProp: string,

    // Key in a single option object that will be used as option's text (by default, "name" key will be used).
    textProp: string,

    // Allows users to add two or more items instead of just one.
    multiple: boolean,

    // Only if "multiple" is enabled - prevents from adding the same item twice.
    unique: boolean,

    // Callback that gets executed on change of input value.
    onInput?: Function,

    // Callback that gets executed when the input is focused.
    onFocus?: Function
};

type State = {
    inputValue: string
};

const autoCompleteStyle = css({
    position: "relative",
    ".mdc-elevation--z1": {
        position: "absolute",
        width: "calc(100% - 2px)",
        left: 1,
        top: 56,
        zIndex: 10,
        maxHeight: 200,
        overflowY: "scroll",
        backgroundColor: "var(--mdc-theme-surface)"
    },
    ul: {
        listStyle: "none",
        width: "100%",
        padding: 0,
        li: {
            padding: 10
        }
    }
});

const suggestionList = css({
    fontWeight: "normal",
    backgroundColor: "var(--mdc-theme-surface)",
    transition: "background-color 0.2s",
    color: "var(--mdc-theme-text-primary-on-background)",
    "&.selected": {
        fontWeight: "bold"
    },
    "&.highlighted": {
        backgroundColor: "var(--mdc-theme-on-background)"
    }
});

let timeout: ?TimeoutID = null;

export class AutoComplete extends React.Component<Props, State> {
    static defaultProps = {
        valueProp: "id",
        textProp: "name",
        multiple: false,
        unique: true
    };

    state = {
        inputValue: ""
    };

    /**
     * Helps us trigger some of the downshift's methods (eg. clearSelection) and helps us to avoid adding state.
     */
    downshift: any = React.createRef();

    getItemValue(option: Option): string {
        return typeof option === "string" ? option : option[this.props.valueProp];
    }

    getItemText(option: Option): string {
        return typeof option === "string" ? option : option[this.props.textProp];
    }

    /**
     * Renders options - based on user's input. It will try to match inputted text with available options.
     * Optionally, if both "multiple" and "unique" props are set to true, it will also filter out items that were
     * already selected.
     * @param options
     * @param isOpen
     * @param highlightedIndex
     * @param selectedItem
     * @param getMenuProps
     * @param getItemProps
     * @returns {*}
     */
    renderOptions({
        options,
        isOpen,
        highlightedIndex,
        selectedItem,
        getMenuProps,
        getItemProps
    }: Object) {
        if (!isOpen) {
            return null;
        }

        const { unique, multiple, value } = this.props;

        const filtered = options.filter(item => {
            // We need to filter received options.
            // 1) If "multiple" and "unique" options were received, we don't want to show already picked options again.
            if (multiple && unique) {
                const values = value;
                if (!Array.isArray(values)) {
                    return true;
                }

                if (values.find(value => this.getItemValue(value) === this.getItemValue(item))) {
                    return false;
                }
            }

            // 2) At the end, we want to show only options that are matched by typed text.
            if (!this.state.inputValue) {
                return true;
            }

            return this.getItemText(item)
                .toLowerCase()
                .includes(this.state.inputValue.toLowerCase());
        });

        if (!filtered.length) {
            return (
                <Elevation z={1}>
                    <ul {...getMenuProps()}>
                        <li>
                            <Typography use={"body2"}>No results.</Typography>
                        </li>
                    </ul>
                </Elevation>
            );
        }

        return (
            <Elevation z={1}>
                <ul {...getMenuProps()}>
                    {filtered.map((item, index) => {
                        const itemValue = this.getItemValue(item);
                        const itemText = this.getItemText(item);

                        // Base classes.
                        const itemClassNames = {
                            [suggestionList]: true,
                            highlighted: highlightedIndex === index,
                            selected: false
                        };

                        // Add "selected" class if the item is selected.
                        if (!multiple) {
                            if (selectedItem && this.getItemValue(selectedItem) === itemValue) {
                                itemClassNames.selected = true;
                            }
                        }

                        // Render the item.
                        return (
                            <li
                                key={itemValue}
                                {...getItemProps({
                                    index,
                                    item,
                                    className: classNames(itemClassNames)
                                })}
                            >
                                <Typography use={"body2"}>{itemText}</Typography>
                            </li>
                        );
                    })}
                </ul>
            </Elevation>
        );
    }

    /**
     * If "multiple" prop is set to true, AutoComplete will add each selected item from the options to the list.
     * Once added, items can also be removed by clicking on the ✕ icon. This is the method that is responsible for
     * rendering selected items (we are using already existing "Chips" component).
     * @returns {*}
     */
    renderMultipleSelection() {
        const { value, onChange, disabled } = this.props;

        return (
            <React.Fragment>
                {Array.isArray(value) && value.length ? (
                    <Chips disabled={disabled}>
                        {value.map((item, index) => (
                            <Chip
                                disabled
                                key={`${this.getItemValue(item)}-${index}`}
                                onRemoval={() => {
                                    // On removal, let's update the value and call "onChange" callback.
                                    if (onChange) {
                                        const newValue = [...value];
                                        newValue.splice(index, 1);
                                        onChange(newValue);
                                    }
                                }}
                            >
                                <ChipText>{this.getItemText(item)}</ChipText>
                                <ChipIcon trailing icon={<BaselineCloseIcon />} />
                            </Chip>
                        ))}
                    </Chips>
                ) : null}
            </React.Fragment>
        );
    }

    render() {
        const {
            children,
            options,
            multiple,
            unique,
            value,
            onChange,
            onInput,
            validation = { isValid: null },
            ...otherInputProps
        } = this.props;

        // Downshift related props.
        const downshiftProps = {
            className: autoCompleteStyle,
            defaultSelectedItem: multiple ? null : value,
            itemToString: item => item && this.getItemText(item),
            onChange: selection => {
                if (!selection || !onChange) {
                    return;
                }

                // If multiple, we have to manage an array of values, otherwise a single value.
                if (multiple) {
                    if (Array.isArray(value) && value.length > 0) {
                        onChange([...value, selection]);
                    } else {
                        onChange([selection]);
                    }

                    this.downshift.current.clearSelection();
                } else {
                    onChange(this.getItemValue(selection));
                }
            }
        };

        return (
            <div className={autoCompleteStyle}>
                <Downshift {...downshiftProps} ref={this.downshift}>
                    {/* "getInputProps" and "openMenu" are not needed in renderOptions method. */}
                    {({ getInputProps, openMenu, ...rest }) => (
                        <div>
                            <Input
                                {...getInputProps({
                                    ...otherInputProps,
                                    validation,
                                    rawOnChange: true,
                                    onChange: e => e,
                                    onBlur: e => e,
                                    onKeyDown: e => {
                                        timeout && clearTimeout(timeout);
                                        const inputValue = e.target.value || "";

                                        // If values are the same, exit, do not update current search term.
                                        if (inputValue === this.state.inputValue) {
                                            return;
                                        }

                                        // If user pressed 'esc', 'enter' or similar... don't do anything.
                                        if (keycode(e).length > 1) {
                                            return;
                                        }

                                        timeout = setTimeout(
                                            () =>
                                                this.setState({ inputValue }, () => {
                                                    onInput && onInput(inputValue);
                                                }),
                                            300
                                        );
                                    },
                                    onFocus: e => {
                                        openMenu();
                                        otherInputProps.onFocus && otherInputProps.onFocus(e);
                                    }
                                })}
                            />
                            {typeof children === "function"
                                ? children({
                                      query: this.state.inputValue,
                                      renderOptions: options => {
                                          return this.renderOptions({
                                              ...rest,
                                              unique,
                                              options
                                          });
                                      }
                                  })
                                : this.renderOptions({ ...rest, unique, options })}

                            {multiple && this.renderMultipleSelection()}
                        </div>
                    )}
                </Downshift>
            </div>
        );
    }
}

export default AutoComplete;
