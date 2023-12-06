import * as React from "react";
import { set } from "dot-prop-immutable";
import { useRouter, UseRouter } from "@webiny/react-router";
import Downshift from "downshift";
import { plugins } from "@webiny/plugins";
import { AdminGlobalSearchPlugin, AdminGlobalSearchPreventHotkeyPlugin } from "~/types";
import classnames from "classnames";
/**
 * Package react-hotkeyz does not have types.
 */
// @ts-expect-error
import { Hotkeys } from "react-hotkeyz";

// UI components
import { Icon } from "@webiny/ui/Icon";
import { Elevation } from "@webiny/ui/Elevation";
import SearchBarDropdown from "./SearchBarDropdown";

// Icons
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";

// Local components
import {
    icon,
    searchBarInput,
    SearchBarInputWrapper,
    SearchBarWrapper,
    SearchShortcut,
    searchWrapper
} from "./styled";
import { makeComposable } from "~/index";

type SearchBarProps = UseRouter;

export interface SearchBarState {
    active: boolean;
    searchTerm: { previous: string; current: string };
    plugins: {
        list: ReadonlyArray<AdminGlobalSearchPlugin>;
        hotKeys: ReadonlyArray<AdminGlobalSearchPreventHotkeyPlugin>;
        current?: AdminGlobalSearchPlugin;
    };
}

class SearchBar extends React.Component<SearchBarProps, SearchBarState> {
    public override state: SearchBarState = {
        active: false,
        searchTerm: {
            previous: "",
            current: ""
        },
        plugins: {
            // List of all registered "admin-global-search" plugins.
            get list() {
                return plugins.byType<AdminGlobalSearchPlugin>("admin-global-search");
            },
            hotKeys: plugins.byType<AdminGlobalSearchPreventHotkeyPlugin>(
                "admin-global-search-prevent-hotkey"
            ),
            // Current plugin - set by examining current route and its query params (on construct).
            current: undefined
        }
    };

    /**
     * Helps us trigger some of the downshift's methods (eg. clearSelection) and helps us to avoid adding state.
     */
    public readonly downshift: any = React.createRef();

    /**
     * At some point we must programmatically focus the input.
     */
    private readonly input = React.createRef<HTMLInputElement>();

    /**
     * Let's check if current route is defined in one of the registered plugins.
     * If so, then check current route query for search term and set it as default value of search input.
     * @param props
     */
    constructor(props: SearchBarProps) {
        super(props);
        this.state.plugins.current = this.state.plugins.list.find(
            p => p.route === props.location.pathname
        );

        if (this.state.plugins.current) {
            let search;
            const query = new URLSearchParams(props.location.search);
            try {
                search = JSON.parse(query.get("search") || "").query;
            } catch (e) {
                search = query.get("search");
            }

            this.state.searchTerm.current = search || "";
            this.state.searchTerm.previous = this.state.searchTerm.current;
        }
    }

    private readonly handleOpenHotkey = (e: React.KeyboardEvent): void => {
        for (let i = 0; i < this.state.plugins.hotKeys.length; i++) {
            const hotKey = this.state.plugins.hotKeys[i];
            if (hotKey.preventOpen(e)) {
                return;
            }
        }

        e.preventDefault();
        if (!this.input.current) {
            return;
        }
        this.input.current.focus();
    };

    /**
     * Re-routes to given route (provided by the plugin) with needed search query params.
     * It also manages previous and current search terms and automatically highlighted item in dropdown.
     * @param plugin
     */
    public readonly submitSearchTerm = (plugin: AdminGlobalSearchPlugin): void => {
        this.setState(
            state => {
                const newState = set(state, "searchTerm.previous", state.searchTerm.current);
                return set(newState, "plugins.current", plugin);
            },
            () => {
                const query = new URLSearchParams();

                if (this.state.searchTerm.current) {
                    // If "search" key in the plugin was defined, it means SearchInput values were set. Otherwise,
                    // we need to send the plain string into the "search" query param. This behavior was needed
                    // eg. for pages, since Page entity doesn't use regular SearchInput type, but plain string.
                    if (plugin.search) {
                        query.set(
                            "search",
                            JSON.stringify({
                                query: this.state.searchTerm.current,
                                ...plugin.search
                            })
                        );
                    } else {
                        query.set("search", this.state.searchTerm.current);
                    }
                }

                this.props.history.push({
                    pathname: plugin.route,
                    search: query.toString()
                });
            }
        );
    };

    private readonly cancelSearchTerm = (): void => {
        this.setState(state => {
            state.searchTerm.current = state.searchTerm.previous;
            return state;
        });
    };

    public override render() {
        return (
            <Downshift ref={this.downshift} itemToString={item => item && item.label}>
                {downshiftProps => {
                    const { isOpen, openMenu, closeMenu, getInputProps } = downshiftProps;

                    return (
                        <div style={{ width: "100%" }}>
                            <Hotkeys
                                zIndex={10}
                                keys={{
                                    // @ts-expect-error
                                    esc: () => document.activeElement.blur(),
                                    "/": this.handleOpenHotkey
                                }}
                            />

                            <Hotkeys
                                zIndex={11}
                                disabled={!isOpen}
                                keys={{
                                    esc: () => {
                                        this.cancelSearchTerm();
                                        closeMenu();
                                    },
                                    enter: () =>
                                        setTimeout(() => {
                                            const { selectedItem } = this.downshift.current.state;
                                            if (selectedItem) {
                                                closeMenu();
                                                this.submitSearchTerm(selectedItem);
                                            }
                                        })
                                }}
                            />

                            <Elevation
                                className={classnames(searchWrapper, { active: this.state.active })}
                                z={0}
                            >
                                <SearchBarWrapper>
                                    <SearchBarInputWrapper>
                                        <Icon className={icon} icon={<SearchIcon />} />

                                        <React.Fragment>
                                            <input
                                                {...getInputProps({
                                                    placeholder: "Search...",
                                                    className: classnames(
                                                        "mdc-text-field__input",
                                                        searchBarInput
                                                    ),
                                                    ref: this.input,
                                                    value: this.state.searchTerm.current,
                                                    onClick: openMenu,
                                                    onBlur: () => {
                                                        this.cancelSearchTerm();
                                                        this.setState({ active: false });
                                                    },
                                                    onFocus: () => {
                                                        this.setState({ active: true });
                                                        openMenu();
                                                    },
                                                    onChange: (
                                                        e: React.ChangeEvent<HTMLInputElement>
                                                    ) => {
                                                        const value = e.target.value || "";
                                                        this.setState(state => {
                                                            state.searchTerm.current = value;
                                                            return state;
                                                        });
                                                    }
                                                })}
                                            />
                                        </React.Fragment>

                                        <SearchShortcut>/</SearchShortcut>
                                    </SearchBarInputWrapper>
                                </SearchBarWrapper>
                                {isOpen && <SearchBarDropdown context={this} />}
                            </Elevation>
                        </div>
                    );
                }}
            </Downshift>
        );
    }
}

const SearchBarContainer = () => {
    const routerProps = useRouter();

    return <SearchBar {...routerProps} />;
};

export default makeComposable("SearchBarContainer", SearchBarContainer);
