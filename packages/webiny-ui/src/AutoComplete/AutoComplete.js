// @flow
import * as React from "react";
import Downshift from "downshift";
import { Input } from "webiny-ui/Input";
import classNames from "classnames";
import { Elevation } from "webiny-ui/Elevation";
import { Typography } from "webiny-ui/Typography";
import keycode from "keycode";
import { autoCompleteStyle, suggestionList } from "./styles";
import type { AutoCompleteBaseProps } from "./types";
import { getOptionValue, getOptionText } from "./utils";
import { isEqual } from "lodash";

type Props = AutoCompleteBaseProps;
type State = {
    inputValue: string
};

export class AutoComplete extends React.Component<Props, State> {
    static defaultProps = {
        valueProp: "id",
        textProp: "name",
        options: [],
        renderItem(item: any) {
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

    componentDidUpdate(previousProps: *) {
        const { value, options } = this.props;
        const { value: previousValue } = previousProps;

        if (!isEqual(value, previousValue)) {
            let item = null;

            if (value) {
                if (typeof value === "object") {
                    item = value;
                } else {
                    item =
                        options.find(option => {
                            return value === getOptionValue(option, this.props);
                        }) || null;
                }
            }

            const { current: downshift } = this.downshift;
            downshift && downshift.selectItem(item);
        }
    }

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

        const { renderItem } = this.props;

        const filtered = options.filter(item => {
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

                        // Add "selected" class if the item is selected.
                        if (
                            selectedItem &&
                            getOptionValue(selectedItem, this.props) === itemValue
                        ) {
                            itemClassNames.selected = true;
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
                                {renderItem.call(this, item, index)}
                            </li>
                        );
                    })}
                </ul>
            </Elevation>
        );
    }

    render() {
        const {
            options,
            onChange,
            value, // eslint-disable-line
            valueProp, // eslint-disable-line
            textProp, // eslint-disable-line
            onInput,
            validation = { isValid: null },
            ...otherInputProps
        } = this.props;

        // Downshift related props.
        const downshiftProps = {
            className: autoCompleteStyle,
            itemToString: item => item && getOptionText(item, this.props),
            onChange: selection => {
                if (!selection || !onChange) {
                    return;
                }
                onChange(getOptionValue(selection, this.props));
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
                                    onFocus: e => {
                                        openMenu();
                                        otherInputProps.onFocus && otherInputProps.onFocus(e);
                                    },
                                    onKeyUp: e => {
                                        const keyCode = keycode(e);
                                        const inputValue = e.target.value || "";

                                        // If user pressed 'esc', 'enter' or similar...
                                        if (keyCode.length > 1) {
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
                                    }
                                })}
                            />
                            {this.renderOptions({ ...rest, options })}
                        </div>
                    )}
                </Downshift>
            </div>
        );
    }
}

export default AutoComplete;
