// @flow
import * as React from "react";
import Downshift from "downshift";
import { Input } from "webiny-ui/Input";
import { Chips, Chip, ChipText, ChipIcon } from "webiny-ui/Chips";
import { getOptionValue, getOptionText } from "./utils";

import { ReactComponent as BaselineCloseIcon } from "./icons/baseline-close-24px.svg";
import classNames from "classnames";
import { Elevation } from "webiny-ui/Elevation";
import { Typography } from "webiny-ui/Typography";
import keycode from "keycode";
import { autoCompleteStyle, suggestionList } from "./styles";

import type { AutoCompleteBaseProps } from "./types";

type Props = AutoCompleteBaseProps & {
    // Prevents adding the same item to the list twice.
    unique: boolean,

    // Set if custom values (not from list of suggestions) are allowed.
    freeInput?: boolean
};

type State = {
    inputValue: string
};

export class MultiAutoComplete extends React.Component<Props, State> {
    static defaultProps = {
        minInput: 2,
        valueProp: "id",
        textProp: "name",
        unique: true,
        simpleValues: false,
        renderItem(item) {
            return <Typography use={"body2"}>{getOptionText(item, this.props)}</Typography>;
        }
    };

    state = {
        inputValue: ""
    };

    /**
     * Helps us trigger some of the downshift's methods (eg. clearSelection) and helps us to avoid adding state.
     */
    downshift: any = React.createRef();

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
    renderOptions({ options, isOpen, highlightedIndex, getMenuProps, getItemProps }: Object) {
        if (!isOpen) {
            return null;
        }

        const { unique, value, renderItem, minInput } = this.props;

        if (minInput && minInput > this.state.inputValue.length) {
            return null;
        }

        const filtered = options.filter(item => {
            // We need to filter received options.
            // 1) If "unique" prop was passed, we don't want to show already picked options again.
            if (unique) {
                const values = value;
                if (!Array.isArray(values)) {
                    return true;
                }

                if (
                    values.find(
                        value =>
                            getOptionValue(value, this.props) === getOptionValue(item, this.props)
                    )
                ) {
                    return false;
                }
            }

            // 2) At the end, we want to show only options that are matched by typed text.
            if (!this.state.inputValue) {
                return true;
            }

            return getOptionText(item, this.props)
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
                        const itemValue = getOptionValue(item, this.props);

                        // Base classes.
                        const itemClassNames = {
                            [suggestionList]: true,
                            highlighted: highlightedIndex === index,
                            selected: false
                        };

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
                                {renderItem.call(this, item, index)}
                            </li>
                        );
                    })}
                </ul>
            </Elevation>
        );
    }

    /**
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
                                key={`${getOptionValue(item, this.props)}-${index}`}
                                onRemoval={() => {
                                    // On removal, let's update the value and call "onChange" callback.
                                    if (onChange) {
                                        const newValue = [...value];
                                        newValue.splice(index, 1);
                                        onChange(newValue);
                                    }
                                }}
                            >
                                <ChipText>{getOptionText(item, this.props)}</ChipText>
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
            options,
            freeInput,
            simpleValues,
            unique,
            value,
            onChange,
            valueProp,
            textProp, // eslint-disable-line
            onInput,
            validation = { isValid: null },
            ...otherInputProps
        } = this.props;

        let defaultSelectedItem = null;

        // Downshift related props.
        const downshiftProps = {
            defaultSelectedItem,
            className: autoCompleteStyle,
            itemToString: item => item && getOptionText(item, this.props),
            onChange: selection => {
                if (!selection || !onChange) {
                    return;
                }

                if (Array.isArray(value) && value.length > 0) {
                    onChange([...value, selection]);
                } else {
                    onChange([selection]);
                }

                this.downshift.current.clearSelection();
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
                                    onKeyUp: e => {
                                        const keyCode = keycode(e);
                                        const inputValue = e.target.value || "";

                                        // If user pressed 'esc', 'enter' or similar...
                                        if (keyCode.length > 1) {
                                            if (keyCode === "enter") {
                                                if (!freeInput) {
                                                    return;
                                                }

                                                if (!onChange) {
                                                    return;
                                                }

                                                const newValue = simpleValues
                                                    ? inputValue
                                                    : { [valueProp]: inputValue };

                                                if (Array.isArray(value) && value.length > 0) {
                                                    onChange([...value, newValue]);
                                                } else {
                                                    onChange([newValue]);
                                                }
                                                return;
                                            }
                                            return;
                                        }

                                        // If values are the same, exit, do not update current search term.
                                        if (inputValue === this.state.inputValue) {
                                            return;
                                        }

                                        this.setState(
                                            state => ({
                                                ...state,
                                                inputValue
                                            }),
                                            () => {
                                                onInput && onInput(inputValue);
                                            }
                                        );
                                    },
                                    onFocus: e => {
                                        openMenu();
                                        otherInputProps.onFocus && otherInputProps.onFocus(e);
                                    }
                                })}
                            />
                            {this.renderOptions({ ...rest, unique, options })}
                            {this.renderMultipleSelection()}
                        </div>
                    )}
                </Downshift>
            </div>
        );
    }
}

export default MultiAutoComplete;
