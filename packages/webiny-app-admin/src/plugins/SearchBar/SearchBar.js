//@flow
import * as React from "react";
import { compose } from "recompose";
import Downshift from "downshift";
import { getPlugin, getPlugins } from "webiny-app/plugins";
import { withRouter } from "webiny-app/components";
import type { SearchPluginType } from "webiny-app-admin/types";
import classnames from "classnames";

// UI components
import { Icon } from "webiny-ui/Icon";
import { Elevation } from "webiny-ui/Elevation";

// Icons
import { ReactComponent as SearchIcon } from "./icons/round-search-24px.svg";
import { ReactComponent as DownIcon } from "./icons/round-arrow_drop_down-24px.svg";

// Local components
import {
    SearchBarWrapper,
    SearchBarInputWrapper,
    SearchBarInput,
    SearchShortcut,
    icon,
    iconDown,
    searchWrapper
} from "./styled";

import SearchDropdown from "./SearchDropdown";

class SearchBar extends React.Component<
    any,
    {
        hasFilters: boolean,
        placeholder: string,
        term: string,
        type: string,
        filters: Object,
        active: boolean
    }
> {
    plugins: Array<SearchPluginType> = getPlugins("global-search");

    state = {
        hasFilters: false,
        placeholder: this.plugins[0] ? this.plugins[0].labels.search : "Search",
        term: "",
        type: this.plugins[0] ? this.plugins[0].name : "",
        filters: {},
        active: false
    };

    onKeyDown = (e: SyntheticKeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === 13) {
            this.onSearch();
        }
    };

    onSearch = () => {
        const type: string = (this.state.type: any);

        const { route }: SearchPluginType = (getPlugin(type): any);
        this.props.router.goToRoute({
            name: route,
            params: { search: JSON.stringify({ query: this.state.term, fields: "name" }) }
        });
    };

    setSearchTerm = ({ currentTarget }: SyntheticInputEvent<HTMLInputElement>) => {
        this.setState({ term: currentTarget.value });
    };

    setSearchType = (type: string) => {
        // We are sure we will receive a SearchPluginType here.
        const plugin: SearchPluginType = (getPlugin(type): any);

        this.setState({
            type,
            hasFilters: typeof plugin.renderFilters === "function",
            placeholder: plugin.labels.search
        });
    };

    render() {
        /*
        if (!this.plugins.length) {
            return null;
        }
        */

        return (
            <Elevation className={classnames(searchWrapper, { active: this.state.active })} z={0}>
                <SearchBarWrapper>
                    <SearchBarInputWrapper>
                        <Icon className={icon} icon={<SearchIcon />} />
                        <SearchBarInput
                            value={this.state.term}
                            onChange={this.setSearchTerm}
                            onKeyDown={this.onKeyDown}
                            onFocus={() => {
                                this.setState({ active: true });
                            }}
                            onBlur={() => {
                                this.setState({ active: false });
                            }}
                            className="mdc-text-field__input"
                            placeholder={this.state.placeholder}
                        />
                        <SearchShortcut>/</SearchShortcut>
                    </SearchBarInputWrapper>
                    {this.state.hasFilters && (
                        <Downshift>
                            {({ isOpen, getToggleButtonProps }) => (
                                <div>
                                    <Icon
                                        className={icon + " " + iconDown}
                                        icon={<DownIcon />}
                                        {...getToggleButtonProps()}
                                    />
                                    {isOpen && (
                                        <SearchDropdown
                                            plugin={getPlugin(this.state.type)}
                                            onSearch={this.onSearch}
                                        />
                                    )}
                                </div>
                            )}
                        </Downshift>
                    )}
                </SearchBarWrapper>
            </Elevation>
        );
    }
}

export default compose(withRouter())(SearchBar);
