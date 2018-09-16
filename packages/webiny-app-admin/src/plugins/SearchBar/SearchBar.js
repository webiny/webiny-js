//@flow
import * as React from "react";
import { compose } from "recompose";
import Downshift from "downshift";
import { getPlugin, getPlugins } from "webiny-app/plugins";
import { withRouter } from "webiny-app/components";
import type { SearchPlugin } from "webiny-app-admin/types";

// UI components
import { Icon } from "webiny-ui/Icon";
import { Elevation } from "webiny-ui/Elevation";
import { Select } from "webiny-ui/Select";

// Icons
import { ReactComponent as SearchIcon } from "./icons/round-search-24px.svg";
import { ReactComponent as DownIcon } from "./icons/round-arrow_drop_down-24px.svg";

// Local components
import {
    SearchBarWrapper,
    SearchBarInputWrapper,
    SearchBarInput,
    SelectWrapper,
    SearchShortcut,
    icon,
    iconDown,
    selectIconDown,
    searchWrapper,
    selectStyles
} from "./styled";

import SearchDropdown from "./SearchDropdown";

class SearchBar extends React.Component<
    any,
    {
        hasFilters: boolean,
        placeholder: string,
        term: string,
        type: string,
        filters: Object
    }
> {
    plugins: Array<SearchPlugin> = getPlugins("global-search");

    state = {
        hasFilters: false,
        placeholder: this.plugins[0] ? this.plugins[0].labels.search : "",
        term: "",
        type: this.plugins[0] ? this.plugins[0].name : "",
        filters: {}
    };

    onKeyDown = (e: SyntheticKeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === 13) {
            this.onSearch();
        }
    };

    onSearch = () => {
        const type: string = (this.state.type: any);

        const { route }: SearchPlugin = (getPlugin(type): any);
        this.props.router.goToRoute({
            name: route,
            params: { search: JSON.stringify({ query: this.state.term, fields: "name" }) }
        });
    };

    setSearchTerm = ({ currentTarget }: SyntheticInputEvent<HTMLInputElement>) => {
        this.setState({ term: currentTarget.value });
    };

    setSearchType = (type: string) => {
        // We are sure we will receive a SearchPlugin here.
        const plugin: SearchPlugin = (getPlugin(type): any);

        this.setState({
            type,
            hasFilters: typeof plugin.renderFilters === "function",
            placeholder: plugin.labels.search
        });
    };

    renderOptions = () => {
        return (
            <SelectWrapper>
                <Select
                    className={selectStyles}
                    value={this.state.type}
                    onChange={this.setSearchType}
                >
                    {this.plugins.map(pl => (
                        <option key={pl.name} value={pl.name}>
                            {pl.labels.option}
                        </option>
                    ))}
                </Select>
                <Icon className={selectIconDown + " " + iconDown + ""} icon={<DownIcon />} />
            </SelectWrapper>
        );
    };

    render() {
        if (!this.plugins.length) {
            return null;
        }

        return (
            <Elevation className={searchWrapper} z={0}>
                <SearchBarWrapper>
                    {this.renderOptions()}
                    <SearchBarInputWrapper>
                        <Icon className={icon} icon={<SearchIcon />} />
                        <SearchBarInput
                            value={this.state.term}
                            onChange={this.setSearchTerm}
                            onKeyDown={this.onKeyDown}
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
