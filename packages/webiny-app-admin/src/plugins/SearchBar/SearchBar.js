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
import SearchBarDropdown from "./SearchBarDropdown";

// Icons
import { ReactComponent as SearchIcon } from "./icons/round-search-24px.svg";

// Local components
import {
    SearchBarWrapper,
    SearchBarInputWrapper,
    SearchShortcut,
    searchBarInput,
    icon,
    searchWrapper
} from "./styled";

type State = {
    active: boolean,
    searchTerm: { previous: string, current: string },
    plugins: {
        list: Array<GlobalSearch>,
        current: ?GlobalSearch
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
            // Current plugin - set by examining current route and its query params (on construct).
            current: undefined
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
        this.state.plugins.current = this.state.plugins.list.find(
            p => p.route === props.router.route.name
        );

        if (this.state.plugins.current) {
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
     * Re-routes to given route (provided by the plugin) with needed search query params.
     * It also manages previous and current search terms and automatically highlighted item in dropdown.
     * @param plugin
     */
    submitSearchTerm = plugin => {
        this.setState(
            state => {
                state.searchTerm.previous = state.searchTerm.current;
                state.plugins.current = plugin;
                return state;
            },
            () => {
                const route = {
                    name: plugin.route,
                    params: {}
                };

                if (this.state.searchTerm.current) {
                    route.params.search = JSON.stringify({
                        query: this.state.searchTerm.current,
                        ...plugin.search
                    });
                }

                this.props.router.goToRoute(route);
            }
        );
    };

    cancelSearchTerm = () => {
        this.setState(state => {
            state.searchTerm.current = state.searchTerm.previous;
            return state;
        });
    };

    render() {
        return (
            <Elevation className={classnames(searchWrapper, { active: this.state.active })} z={0}>
                <SearchBarWrapper>
                    <SearchBarInputWrapper>
                        <Icon className={icon} icon={<SearchIcon />} />

                        <Downshift ref={this.downshift} itemToString={item => item && item.label}>
                            {downshiftProps => {
                                const {
                                    selectedItem,
                                    isOpen,
                                    openMenu,
                                    closeMenu,
                                    getInputProps
                                } = downshiftProps;

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
                                                onBlur: () => {
                                                    this.cancelSearchTerm();
                                                    this.setState({ active: false });
                                                },
                                                onFocus: () => {
                                                    this.setState({ active: true });
                                                    openMenu();
                                                },
                                                onChange: e => {
                                                    const value = e.target.value || "";
                                                    this.setState(state => {
                                                        state.searchTerm.current = value;
                                                        return state;
                                                    });
                                                },
                                                onKeyUp: e => {
                                                    switch (keycode(e)) {
                                                        case "esc":
                                                            e.preventDefault();
                                                            this.cancelSearchTerm();
                                                            closeMenu();
                                                            break;
                                                        case "enter":
                                                            e.preventDefault();
                                                            if (selectedItem) {
                                                                closeMenu();
                                                                this.submitSearchTerm(selectedItem);
                                                            }
                                                            break;
                                                    }
                                                }
                                            })}
                                        />
                                        {isOpen && <SearchBarDropdown context={this} />}
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
