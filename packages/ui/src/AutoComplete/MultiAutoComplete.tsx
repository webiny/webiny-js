import * as React from "react";
import Downshift from "downshift";
import MaterialSpinner from "react-spinner-material";
import { Input } from "../Input";
import { Chips, Chip } from "../Chips";
import { getOptionValue, getOptionText, findInAliases } from "./utils";
import { List, ListItem, ListItemMeta } from "~/List";
import { IconButton } from "~/Button";
import classNames from "classnames";
import { Elevation } from "../Elevation";
import { Typography } from "../Typography";
import { autoCompleteStyle, suggestionList } from "./styles";
import { AutoCompleteBaseProps } from "./types";
import { FormElementMessage } from "../FormElementMessage";

import { ReactComponent as BaselineCloseIcon } from "./icons/baseline-close-24px.svg";
import { ReactComponent as PrevIcon } from "./icons/navigate_before-24px.svg";
import { ReactComponent as NextIcon } from "./icons/navigate_next-24px.svg";
import { ReactComponent as PrevAllIcon } from "./icons/skip_previous-24px.svg";
import { ReactComponent as NextAllIcon } from "./icons/skip_next-24px.svg";
import { ReactComponent as DeleteIcon } from "./icons/baseline-close-24px.svg";
import { ReactComponent as ReorderIcon } from "./icons/reorder_black_24dp.svg";

import { css } from "emotion";
import { ListItemGraphic } from "../List";
const style = {
    pagination: {
        bar: css({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #fa5723",
            padding: "6px 0"
        }),
        pages: css({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
        }),
        searchInput: css({
            height: "42px !important"
        }),
        list: css({
            padding: "0 0 5px 0 !important",
            ".mdc-list-item": {
                borderBottom: "1px solid var(--mdc-theme-on-background)"
            }
        }),
        secondaryText: css({
            color: "var(--mdc-theme-text-secondary-on-background)"
        })
    }
};
const listStyles = css({
    "&.multi-autocomplete__options-list": {
        listStyle: "none",
        paddingLeft: 0,
        "& li": {
            margin: 0
        }
    }
});

export type MultiAutoCompleteProps = AutoCompleteBaseProps & {
    /**
     * Prevents adding the same item to the list twice.
     */
    unique: boolean;

    /**
     * Set if custom values (not from list of suggestions) are allowed.
     */
    allowFreeInput?: boolean;

    /**
     *  If true, will show a loading spinner on the right side of the input.
     */
    loading?: boolean;

    /**
     * Use data list instead of default Chips component. Useful when expecting a lot of data.
     */
    useMultipleSelectionList?: boolean;

    /**
     * Render list item when `useMultipleSelectionList` is used.
     */
    renderListItemLabel?: Function;
};

type State = {
    inputValue: string;
    multipleSelectionPage: number;
    multipleSelectionSearch: string;
    reorderFormVisible: string;
    reorderFormValue: string;
};

function Spinner() {
    return <MaterialSpinner size={24} spinnerColor={"#fa5723"} spinnerWidth={2} visible />;
}

const DEFAULT_PER_PAGE = 10;
function paginateMultipleSelection(multipleSelection, limit, page, search) {
    // Assign a real index, so that later when we press delete, we know what is the actual index we're deleting.
    let data = Array.isArray(multipleSelection)
        ? multipleSelection.map((item, index) => ({ ...item, index }))
        : [];

    if (typeof search === "string" && search) {
        data = data.filter(item => {
            return (
                typeof item.name === "string" &&
                item.name.toLowerCase().includes(search.toLowerCase())
            );
        });
    }

    const lastPage = Math.ceil(data.length / limit);
    const totalCount = data.length;

    page = page || lastPage;
    data = data.slice((page - 1) * limit, page * limit);

    let from = 0;
    let to = 0;
    if (data.length) {
        from = (page - 1) * limit + 1;
        to = from + (data.length - 1);
    }

    const meta = {
        hasData: data.length > 0,
        totalCount,
        from,
        to,
        page: page,
        lastPage,
        limit,
        hasPrevious: page > 1,
        hasNext: page < lastPage
    };

    return { data, meta };
}

export class MultiAutoComplete extends React.Component<MultiAutoCompleteProps, State> {
    static defaultProps = {
        valueProp: "id",
        textProp: "name",
        unique: true,
        options: [],
        useSimpleValues: false,
        useMultipleSelectionList: false,
        renderItem(item: any) {
            return <Typography use={"body2"}>{getOptionText(item, this.props)}</Typography>;
        },
        renderListItemLabel(item: any) {
            return getOptionText(item, this.props);
        }
    };

    state = {
        inputValue: "",
        multipleSelectionPage: 0,
        multipleSelectionSearch: "",
        reorderFormVisible: "",
        reorderFormValue: ""
    };

    /**
     * Helps us trigger some of the downshift's methods (eg. clearSelection) and helps us to avoid adding state.
     */
    downshift: any = React.createRef();

    assignedValueAfterClearing = {
        set: false,
        selection: null
    };

    setMultipleSelectionPage = multipleSelectionPage => {
        this.setState({ multipleSelectionPage });
    };

    setMultipleSelectionSearch = multipleSelectionSearch => {
        this.setState({ multipleSelectionSearch });
    };

    getOptions() {
        const { unique, value, allowFreeInput, useSimpleValues, options } = this.props;

        const filtered = options.filter(item => {
            // We need to filter received options.
            // 1) If "unique" prop was passed, we don't want to show already picked options again.
            if (unique) {
                const values = value;
                if (Array.isArray(values)) {
                    if (
                        values.find(
                            value =>
                                getOptionValue(value, this.props) ===
                                getOptionValue(item, this.props)
                        )
                    ) {
                        return false;
                    }
                }
            }

            // 2) At the end, we want to show only options that are matched by typed text.
            if (!this.state.inputValue) {
                return true;
            }

            if (item.aliases) {
                return findInAliases(item, this.state.inputValue);
            }

            return getOptionText(item, this.props)
                .toLowerCase()
                .includes(this.state.inputValue.toLowerCase());
        });

        // If free input is allowed, prepend typed value to the list.
        if (allowFreeInput && this.state.inputValue) {
            if (useSimpleValues) {
                const existingValue = filtered.includes(this.state.inputValue);
                if (!existingValue) {
                    filtered.unshift(this.state.inputValue);
                }
            } else {
                const existingValue = filtered.find(
                    item => this.state.inputValue === getOptionText(item, this.props)
                );
                if (!existingValue) {
                    filtered.unshift({ [this.props.textProp]: this.state.inputValue });
                }
            }
        }

        return filtered;
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
    renderOptions({ options, isOpen, highlightedIndex, getMenuProps, getItemProps }: any) {
        if (!isOpen) {
            return null;
        }

        if (!options.length) {
            return (
                <Elevation z={1}>
                    <ul
                        className={classNames("multi-autocomplete__options-list", listStyles)}
                        {...getMenuProps()}
                    >
                        <li>
                            <Typography use={"body2"}>No results.</Typography>
                        </li>
                    </ul>
                </Elevation>
            );
        }

        const { renderItem } = this.props;
        return (
            <Elevation z={1}>
                <ul
                    className={classNames("multi-autocomplete__options-list", listStyles)}
                    {...getMenuProps()}
                >
                    {options.map((item, index) => {
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
                                key={itemValue + index}
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
        const {
            value,
            onChange,
            disabled,
            useMultipleSelectionList,
            description,
            renderListItemLabel
        } = this.props;

        if (useMultipleSelectionList) {
            const { data, meta } = paginateMultipleSelection(
                value,
                DEFAULT_PER_PAGE,
                this.state.multipleSelectionPage,
                this.state.multipleSelectionSearch
            );

            return (
                <>
                    <div className={style.pagination.bar}>
                        <div>
                            <Input
                                className={style.pagination.searchInput}
                                placeholder={"Search selected..."}
                                value={this.state.multipleSelectionSearch}
                                onChange={value => {
                                    this.setMultipleSelectionSearch(value);
                                    this.setMultipleSelectionPage(value ? 1 : 0);
                                }}
                            />
                        </div>

                        <div className={style.pagination.pages}>
                            <div className={meta.hasData ? "" : style.pagination.secondaryText}>
                                {meta.from} - {meta.to} of {meta.totalCount}
                            </div>
                            <div>
                                <IconButton
                                    icon={<PrevAllIcon />}
                                    disabled={!meta.hasData || meta.page === 1}
                                    onClick={() => this.setMultipleSelectionPage(1)}
                                />
                                <IconButton
                                    icon={<PrevIcon />}
                                    disabled={!meta.hasData || !meta.hasPrevious}
                                    onClick={() => this.setMultipleSelectionPage(meta.page - 1)}
                                />
                                <IconButton
                                    icon={<NextIcon />}
                                    disabled={!meta.hasData || !meta.hasNext}
                                    onClick={() => this.setMultipleSelectionPage(meta.page + 1)}
                                />
                                <IconButton
                                    icon={<NextAllIcon />}
                                    disabled={!meta.hasData || meta.page === meta.lastPage}
                                    onClick={() => this.setMultipleSelectionPage(meta.lastPage)}
                                />
                            </div>
                        </div>
                    </div>

                    <List className={style.pagination.list}>
                        {meta.hasData ? (
                            data.map((item, index) => {
                                const key = `${getOptionValue(item, this.props)}-${index}`;
                                if (this.state.reorderFormVisible === key) {
                                    return (
                                        <ListItem key={key}>
                                            <ListItemGraphic>
                                                <IconButton disabled icon={<ReorderIcon />} />
                                            </ListItemGraphic>
                                            <Input
                                                value={this.state.reorderFormValue}
                                                onKeyDown={(e: any) => {
                                                    const key = e.key;
                                                    if (key !== "Escape" && key !== "Enter") {
                                                        return;
                                                    }

                                                    if (key === "Enter") {
                                                        // Reorder the item.
                                                        const newValue = [...value];
                                                        newValue.splice(
                                                            e.target.value - 1,
                                                            0,
                                                            newValue.splice(item.index, 1)[0]
                                                        );

                                                        onChange(newValue);
                                                    }

                                                    this.setState({
                                                        reorderFormVisible: "",
                                                        reorderFormValue: ""
                                                    });
                                                }}
                                                onChange={value =>
                                                    this.setState({ reorderFormValue: value })
                                                }
                                                type={"number"}
                                                autoFocus
                                                className={style.pagination.searchInput}
                                                placeholder={
                                                    "Type a new order number and press Enter, or press Esc to cancel."
                                                }
                                            />
                                            <ListItemMeta>
                                                <IconButton icon={<DeleteIcon />} disabled />
                                            </ListItemMeta>
                                        </ListItem>
                                    );
                                }

                                return (
                                    <ListItem key={key}>
                                        <ListItemGraphic>
                                            <IconButton
                                                icon={<ReorderIcon />}
                                                onClick={() => {
                                                    this.setState({ reorderFormVisible: key });
                                                }}
                                            />
                                        </ListItemGraphic>
                                        <div
                                            style={{
                                                color: "var(--mdc-theme-text-secondary-on-background)",
                                                marginRight: 8,
                                                minWidth: 32
                                            }}
                                        >
                                            {item.index + 1}.
                                        </div>{" "}
                                        {renderListItemLabel.call(this, item)}
                                        <ListItemMeta>
                                            <IconButton
                                                icon={<DeleteIcon />}
                                                onClick={() => {
                                                    if (onChange) {
                                                        onChange([
                                                            ...value.slice(0, item.index),
                                                            ...value.slice(item.index + 1)
                                                        ]);
                                                    }
                                                }}
                                            />
                                        </ListItemMeta>
                                    </ListItem>
                                );
                            })
                        ) : (
                            <ListItem>
                                <span className={style.pagination.secondaryText}>
                                    Nothing to show.
                                </span>
                            </ListItem>
                        )}
                    </List>
                    <div>
                        <FormElementMessage>{description}</FormElementMessage>
                    </div>
                </>
            );
        }

        const hasItems = Array.isArray(value) && value.length;
        if (!hasItems) {
            return null;
        }

        return (
            <Chips disabled={disabled}>
                {value.map((item, index) => (
                    <Chip
                        label={getOptionText(item, this.props)}
                        key={`${getOptionValue(item, this.props)}-${index}`}
                        trailingIcon={<BaselineCloseIcon />}
                        onRemove={() => {
                            if (onChange) {
                                onChange([...value.slice(0, index), ...value.slice(index + 1)]);
                            }
                        }}
                    />
                ))}
            </Chips>
        );
    }

    render() {
        const {
            props,
            props: {
                options: rawOptions, // eslint-disable-line
                allowFreeInput, // eslint-disable-line
                useSimpleValues, // eslint-disable-line
                unique,
                value,
                onChange,
                valueProp, // eslint-disable-line
                textProp, // eslint-disable-line
                onInput,
                validation = { isValid: null },
                useMultipleSelectionList,
                description,
                ...otherInputProps
            }
        } = this;

        const options = this.getOptions();

        return (
            <div className={classNames(autoCompleteStyle, props.className)}>
                <Downshift
                    defaultSelectedItem={null}
                    // @ts-ignore
                    className={autoCompleteStyle}
                    itemToString={item => item && getOptionText(item, props)}
                    ref={this.downshift}
                    onChange={selection => {
                        if (!this.assignedValueAfterClearing.set) {
                            this.assignedValueAfterClearing = {
                                set: true,
                                selection
                            };
                            this.downshift.current.clearSelection();
                            this.setMultipleSelectionPage(0);
                            return;
                        }

                        if (this.assignedValueAfterClearing.set) {
                            this.setState({ inputValue: "" });
                            this.assignedValueAfterClearing.set = false;
                            if (Array.isArray(value)) {
                                onChange &&
                                    onChange([...value, this.assignedValueAfterClearing.selection]);
                            } else {
                                onChange && onChange([this.assignedValueAfterClearing.selection]);
                            }
                        }
                    }}
                >
                    {/* "getInputProps" and "openMenu" are not needed in renderOptions method. */}
                    {({ getInputProps, openMenu, ...rest }) => (
                        <div>
                            <Input
                                {...getInputProps({
                                    ...otherInputProps,
                                    // @ts-ignore
                                    validation,

                                    // Only pass description if not using "useMultipleSelectionList".
                                    description: useMultipleSelectionList ? null : description,
                                    rawOnChange: true,
                                    trailingIcon: this.props.loading && <Spinner />,
                                    onChange: e => e,
                                    onBlur: e => e,
                                    onKeyUp: (e: any) => {
                                        const inputValue = e.target.value || "";

                                        // Set current input value into state and trigger onInput if different.
                                        if (inputValue !== this.state.inputValue) {
                                            this.setState({ inputValue }, () => {
                                                onInput && onInput(inputValue);
                                            });
                                        }
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
