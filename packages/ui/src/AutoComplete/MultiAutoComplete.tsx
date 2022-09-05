import React from "react";
import Downshift, { ControllerStateAndHelpers, PropGetters } from "downshift";
import MaterialSpinner from "react-spinner-material";
import { Input } from "~/Input";
import { Chips, Chip } from "../Chips";
import { getOptionValue, getOptionText, findInAliases } from "./utils";
import { List, ListItem, ListItemMeta } from "~/List";
import { IconButton } from "~/Button";
import classNames from "classnames";
import { Elevation } from "~/Elevation";
import { Typography } from "~/Typography";
import { autoCompleteStyle, suggestionList } from "./styles";
import { AutoCompleteBaseProps } from "./types";
import { FormElementMessage } from "~/FormElementMessage";
import { ReactComponent as BaselineCloseIcon } from "./icons/baseline-close-24px.svg";
import { ReactComponent as PrevIcon } from "./icons/navigate_before-24px.svg";
import { ReactComponent as NextIcon } from "./icons/navigate_next-24px.svg";
import { ReactComponent as PrevAllIcon } from "./icons/skip_previous-24px.svg";
import { ReactComponent as NextAllIcon } from "./icons/skip_next-24px.svg";
import { ReactComponent as DeleteIcon } from "./icons/baseline-close-24px.svg";
import { ReactComponent as ReorderIcon } from "./icons/reorder_black_24dp.svg";
import { css } from "emotion";
import { ListItemGraphic } from "~/List";
import { AutoCompleteProps } from "~/AutoComplete/AutoComplete";

const listItemMetaClassName = css({
    display: "table"
});

const iconButtonClassName = css({
    display: "table-cell !important"
});

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

interface SelectionItem {
    name: string;
}

type MultiAutoCompletePropsValue = SelectionItem[] | string[];

export interface MultiAutoCompleteProps extends Omit<AutoCompleteBaseProps, "value"> {
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
    /**
     * Render in meta wrapper
     */
    renderListItemOptions?: (item: any) => React.ReactNode | null;

    /* A component that renders supporting UI in case of no result found. */
    noResultFound?: React.ReactNode;
    /**
     * Value is an array of strings. But can be undefined.
     */
    value?: MultiAutoCompletePropsValue;
}

interface MultiAutoCompleteState {
    inputValue: string;
    multipleSelectionPage: number;
    multipleSelectionSearch: string;
    reorderFormVisible: string;
    reorderFormValue: string;
}

const Spinner: React.FC = () => {
    return <MaterialSpinner size={24} spinnerColor={"#fa5723"} spinnerWidth={2} visible />;
};

interface RenderOptionsParams
    extends Omit<ControllerStateAndHelpers<any>, "getInputProps" | "openMenu"> {
    options: AutoCompleteProps["options"];
    unique: boolean;
}

interface OptionsListProps {
    getMenuProps: PropGetters<Record<string, any>>["getMenuProps"];
}

interface AssignedValueAfterClearing {
    set: boolean;
    selection: string | null;
}

const OptionsList: React.FC<OptionsListProps> = ({ getMenuProps, children }) => {
    return (
        <Elevation z={1}>
            <ul
                className={classNames("multi-autocomplete__options-list", listStyles)}
                {...getMenuProps()}
            >
                {children}
            </ul>
        </Elevation>
    );
};

export class MultiAutoComplete extends React.Component<
    MultiAutoCompleteProps,
    MultiAutoCompleteState
> {
    static defaultProps: Partial<MultiAutoCompleteProps> = {
        valueProp: "id",
        textProp: "name",
        unique: true,
        options: [],
        useSimpleValues: false,
        useMultipleSelectionList: false,
        /**
         * We cast this as MultiAutoComplete because renderItem() is executed via .call() where this is MultiAutoComplete instance.
         */
        renderItem(item: any) {
            return (
                <Typography use={"body2"}>
                    {getOptionText(item, (this as unknown as MultiAutoComplete).props)}
                </Typography>
            );
        },
        /**
         * We cast this as MultiAutoComplete because renderListItemLabel() is executed via .call() where this is MultiAutoComplete instance.
         */
        renderListItemLabel(item: any) {
            return getOptionText(item, (this as unknown as MultiAutoComplete).props);
        }
    };

    public override state: MultiAutoCompleteState = {
        inputValue: "",
        multipleSelectionPage: 0,
        multipleSelectionSearch: "",
        reorderFormVisible: "",
        reorderFormValue: ""
    };

    /**
     * Helps us trigger some of the downshift's methods (eg. clearSelection) and helps us to avoid adding state.
     */
    private downshift = React.createRef<any>();

    private assignedValueAfterClearing: AssignedValueAfterClearing = {
        set: false,
        selection: null
    };

    setMultipleSelectionPage = (multipleSelectionPage: number): void => {
        this.setState({ multipleSelectionPage });
    };

    setMultipleSelectionSearch = (multipleSelectionSearch: string): void => {
        this.setState({ multipleSelectionSearch });
    };

    getOptions() {
        const { unique, value, allowFreeInput, useSimpleValues, options } = this.props;

        const values = Array.isArray(value) ? [...value] : [];

        const filtered = [...options];

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

        return filtered.filter(item => {
            // We need to filter received options.
            // 1) If "unique" prop was passed, we don't want to show already picked options again.
            if (unique) {
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
    }

    /**
     * Renders options - based on user's input. It will try to match input text with available options.
     */
    private renderOptions(params: RenderOptionsParams) {
        const { options, isOpen, highlightedIndex, getMenuProps, getItemProps } = params;
        if (!isOpen) {
            return null;
        }

        /**
         * Suggest user to start typing when there are no options available to choose from.
         */
        if (!this.state.inputValue && !options.length) {
            return (
                <OptionsList getMenuProps={getMenuProps}>
                    <li>
                        <Typography use={"body2"}>Start typing to find entry</Typography>
                    </li>
                </OptionsList>
            );
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
                            {this.props.noResultFound}
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

    paginateMultipleSelection() {
        const { value } = this.props;
        const limit = 10;
        let page = this.state.multipleSelectionPage;
        const search = this.state.multipleSelectionSearch;

        // Assign a real index, so that later when we press delete, we know what is the actual index we're deleting.
        let data = Array.isArray(value)
            ? value.map((option, index) => {
                  return { option, index };
              })
            : [];

        if (search) {
            data = data.filter(item => {
                return getOptionText(item.option, this.props)
                    .toLowerCase()
                    .includes(search.toLowerCase());
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

    /**
     * Once added, items can also be removed by clicking on the ✕ icon. This is the method that is responsible for
     * rendering selected items (we are using already existing "Chips" component).
     */
    public renderMultipleSelection() {
        const {
            value,
            onChange,
            disabled,
            useMultipleSelectionList,
            description,
            renderListItemLabel,
            renderListItemOptions
        } = this.props;

        if (useMultipleSelectionList) {
            const { data, meta } = this.paginateMultipleSelection();

            return (
                <>
                    <div className={style.pagination.bar}>
                        <div>
                            <Input
                                className={style.pagination.searchInput}
                                placeholder={"Search selected..."}
                                value={this.state.multipleSelectionSearch}
                                data-testid="pb.pagination.search"
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
                                const key = `${getOptionValue(item.option, this.props)}-${index}`;
                                if (this.state.reorderFormVisible === key) {
                                    return (
                                        <ListItem key={key}>
                                            <ListItemGraphic>
                                                <IconButton disabled icon={<ReorderIcon />} />
                                            </ListItemGraphic>
                                            <Input
                                                value={this.state.reorderFormValue}
                                                data-testid="pb.pagination.input"
                                                onKeyDown={(e: any) => {
                                                    const key = e.key;
                                                    if (key !== "Escape" && key !== "Enter") {
                                                        return;
                                                    }

                                                    if (key === "Enter") {
                                                        // Reorder the item.
                                                        const newValue = [
                                                            ...(value as SelectionItem[])
                                                        ];
                                                        newValue.splice(
                                                            e.target.value - 1,
                                                            0,
                                                            newValue.splice(item.index, 1)[0]
                                                        );

                                                        if (onChange) {
                                                            onChange(newValue);
                                                        }
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
                                        {renderListItemLabel &&
                                            renderListItemLabel.call(this, item.option)}
                                        <ListItemMeta className={listItemMetaClassName}>
                                            {renderListItemOptions &&
                                                renderListItemOptions.call(this, item.option)}
                                            <IconButton
                                                icon={<DeleteIcon />}
                                                className={iconButtonClassName}
                                                onClick={() => {
                                                    if (!onChange) {
                                                        return;
                                                    }
                                                    onChange([
                                                        ...(value as SelectionItem[]).slice(
                                                            0,
                                                            item.index
                                                        ),
                                                        ...(value as SelectionItem[]).slice(
                                                            item.index + 1
                                                        )
                                                    ]);
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
                {(value as SelectionItem[]).map((item, index) => (
                    <Chip
                        label={getOptionText(item, this.props)}
                        key={`${getOptionValue(item, this.props)}-${index}`}
                        trailingIcon={<BaselineCloseIcon />}
                        onRemove={() => {
                            if (!onChange) {
                                return;
                            }
                            onChange([
                                ...(value as SelectionItem[]).slice(0, index),
                                ...(value as SelectionItem[]).slice(index + 1)
                            ]);
                        }}
                    />
                ))}
            </Chips>
        );
    }

    public override render() {
        const {
            props,
            props: {
                // options: rawOptions,
                // allowFreeInput,
                // useSimpleValues,
                unique,
                value,
                onChange,
                // valueProp,
                // textProp,
                onInput,
                validation = { isValid: null, message: null },
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
                    // @ts-ignore there is no className on Downshift
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
