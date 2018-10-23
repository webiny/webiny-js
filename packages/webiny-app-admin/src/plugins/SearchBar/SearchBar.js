//@flow
import * as React from "react";
import { compose } from "recompose";
import Downshift from "downshift";
import { getPlugins } from "webiny-app/plugins";
import { withRouter, withKeyHandler } from "webiny-app/components";
import type { GlobalSearch } from "webiny-app-admin/types";
import classnames from "classnames";
import keycode from "keycode";

// UI components
import { Icon } from "webiny-ui/Icon";
import { Elevation } from "webiny-ui/Elevation";
import { List, ListItem, ListItemGraphic, ListItemText, ListItemMeta } from "webiny-ui/List";

// Icons
import { ReactComponent as SearchIcon } from "./icons/round-search-24px.svg";

// Local components
import {
    SearchBarWrapper,
    SearchBarInputWrapper,
    SearchShortcut,
    searchBarInput,
    searchBarDropdown,
    icon,
    searchWrapper
} from "./styled";

type State = {
    active: boolean,
    searchTerm: { previous: string, current: string },
    plugins: {
        list: Array<GlobalSearch>,
        initial: ?GlobalSearch
    }
};

class SearchBar extends React.Component<*, State> {
    state = {
        active: false,
        searchTerm: {
            previous: "",
            current: ""
        },
        plugins: {
            // List of all registered "global-search" plugins.
            list: getPlugins("global-search"),
            // Initial plugin - set by examining current route and its query params (on construct).
            initial: undefined
        }
    };

    /**
     * Helps us trigger some of the downshift's methods (eg. clearSelection) and helps us to avoid adding state.
     */
    downshift: any = React.createRef();

    /**
     * At some point we must programmatically focus the input.
     */
    input: any = React.createRef();

    /**
     * Let's check if current route is defined in one of the registered plugins.
     * If so, then check current route query for search term and set it as default value of search input.
     * @param props
     */
    constructor(props) {
        super();
        this.state.plugins.initial = this.state.plugins.list.find(
            p => p.route === props.router.route.name
        );

        if (this.state.plugins.initial) {
            try {
                this.state.searchTerm.current = JSON.parse(props.router.getQuery().search).query;
                this.state.searchTerm.previous = this.state.searchTerm.current;
            } catch (e) {
                // Do nothing.
            }
        }
    }

    componentDidMount() {
        const { addKeyHandler } = this.props;
        addKeyHandler("/", e => {
            e.preventDefault();
            this.input.current.focus();
        });
    }

    componentWillUnmount() {
        this.props.removeKeyHandler("/");
    }

    /**
     * Higlights the item via downshift. We automatically highlight previously searched item - better UX.
     */
    setHighlightedDropdownItem(selectedItem) {
        this.downshift.current.setHighlightedIndex(this.state.plugins.list.indexOf(selectedItem));
    }

    /**
     * Re-routes to given route (provided by the plugin) with needed search query params.
     * It also manages previous and current search terms and automatically highlighted item in dropdown.
     * @param selectedItem
     */
    submitSearchTerm(selectedItem) {
        this.setState(
            state => {
                state.searchTerm.previous = state.searchTerm.current;
                return state;
            },
            () => {
                const route = {
                    name: selectedItem.route,
                    params: {}
                };

                if (this.state.searchTerm.current) {
                    route.params.search = JSON.stringify({
                        query: this.state.searchTerm.current,
                        ...selectedItem.search
                    });
                }

                this.props.router.goToRoute(route);
                this.setHighlightedDropdownItem(selectedItem);
            }
        );
    }

    /**
     * Renders options - basically a menu with different modules that can be searched. These are provided
     * by registered plugins ("global-search" type).
     * @param getMenuProps
     * @param getItemProps
     * @param selectedItem
     * @param highlightedIndex
     * @returns {*}
     */
    renderDropdown({ getMenuProps, getItemProps, selectedItem, highlightedIndex }) {
        return (
            <List {...getMenuProps({ className: searchBarDropdown })}>
                {this.state.plugins.list.map((item: GlobalSearch, index) => {
                    // Base classes.
                    const itemClassNames = {
                        highlighted: highlightedIndex === index,
                        selected: false
                    };

                    // Add "selected" class if the item is selected.
                    if (selectedItem && selectedItem.route === item.route) {
                        itemClassNames.selected = true;
                    }

                    return (
                        <ListItem
                            key={item.route}
                            {...getItemProps({
                                index,
                                item,
                                className: classnames(itemClassNames)
                            })}
                        >
                            <ListItemGraphic>➡</ListItemGraphic>
                            <ListItemText>
                                {this.state.searchTerm.current || "Search for all..."}
                            </ListItemText>
                            <ListItemMeta>in {item.label}</ListItemMeta>
                        </ListItem>
                    );
                })}
            </List>
        );
    }

    render() {
        return (
            <Elevation className={classnames(searchWrapper, { active: this.state.active })} z={0}>
                <SearchBarWrapper>
                    <SearchBarInputWrapper>
                        <Icon className={icon} icon={<SearchIcon />} />

                        <Downshift
                            ref={this.downshift}
                            initialValue={this.state.searchTerm.current}
                            initialSelectedItem={this.state.plugins.initial}
                            itemToString={item => item && item.label}
                            onSelect={selectedItem => this.submitSearchTerm(selectedItem)}
                        >
                            {downshift => {
                                const {
                                    selectedItem,
                                    isOpen,
                                    openMenu,
                                    closeMenu,
                                    getInputProps
                                } = downshift;

                                return (
                                    <div>
                                        <input
                                            {...getInputProps({
                                                placeholder: "Search...",
                                                className: classnames(
                                                    "mdc-text-field__input",
                                                    searchBarInput
                                                ),
                                                ref: this.input,
                                                value: this.state.searchTerm.current,
                                                onChange: e => {
                                                    const value = e.target.value || "";
                                                    if (this.state.searchTerm.current !== value) {
                                                        this.setState(state => {
                                                            state.searchTerm.current = value;
                                                            return state;
                                                        });
                                                    }
                                                },
                                                onKeyUp: e => {
                                                    switch (keycode(e)) {
                                                        case "esc":
                                                            // Just bring back previous search term.
                                                            this.setState(state => {
                                                                state.searchTerm.current =
                                                                    state.searchTerm.previous;
                                                                return state;
                                                            }, closeMenu);
                                                            break;
                                                        case "enter":
                                                            if (selectedItem) {
                                                                closeMenu();
                                                                this.submitSearchTerm(selectedItem);
                                                            }
                                                            break;
                                                    }
                                                },
                                                onFocus: () => {
                                                    this.setState({ active: true }, () => {
                                                        this.setHighlightedDropdownItem(
                                                            selectedItem
                                                        );
                                                        openMenu();
                                                    });
                                                },
                                                onBlur: () => {
                                                    this.setState(state => {
                                                        state.searchTerm.current =
                                                            state.searchTerm.previous;
                                                        state.active = false;
                                                        return state;
                                                    });
                                                }
                                            })}
                                        />

                                        {isOpen && this.renderDropdown(downshift)}
                                    </div>
                                );
                            }}
                        </Downshift>
                        <SearchShortcut>/</SearchShortcut>
                    </SearchBarInputWrapper>
                </SearchBarWrapper>
            </Elevation>
        );
    }
}

export default compose(
    withRouter(),
    withKeyHandler()
)(SearchBar);
