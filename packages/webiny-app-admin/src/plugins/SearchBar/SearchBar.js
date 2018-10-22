//@flow
import * as React from "react";
import { compose } from "recompose";
import Downshift from "downshift";
import { getPlugin, getPlugins } from "webiny-app/plugins";
import { withRouter } from "webiny-app/components";
import type { SearchPlugin } from "webiny-app-admin/types";
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

class SearchBar extends React.Component<
    any,
    {
        placeholder: string,
        term: string,
        type: string,
        active: boolean
    }
> {
    plugins: Array<SearchPlugin> = getPlugins("global-search");

    state = {
        placeholder: "Search",
        term: "",
        active: false
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
            placeholder: plugin.labels.search
        });
    };

    renderDropdown({ getMenuProps, getItemProps }) {
        return (
            <ul {...getMenuProps()}>
                {this.plugins.map((item: SearchPlugin, index) => (
                    <li
                        {...getItemProps({
                            index,
                            item
                        })}
                        key={item.route}
                    >
                        {item.label}
                    </li>
                ))}
            </ul>
        );
    }

    render() {
        return (
            <Elevation className={classnames(searchWrapper, { active: this.state.active })} z={0}>
                <SearchBarWrapper>
                    <SearchBarInputWrapper>
                        <Icon className={icon} icon={<SearchIcon />} />

                        <Downshift>
                            {({ isOpen, openMenu, getInputProps, ...restOfDownshiftProps }) => (
                                <div>
                                    <SearchBarInput
                                        {...getInputProps({
                                            value: this.state.term,
                                            onChange: this.setSearchTerm,
                                            onKeyDown: this.onKeyDown,
                                            onFocus: () => {
                                                this.setState({ active: true });
                                                openMenu();
                                            },
                                            onBlur: () => {
                                                this.setState({ active: false });
                                            },
                                            className: "mdc-text-field__input",
                                            placeholder: this.state.placeholder
                                        })}
                                    />

                                    {/*<Icon
                                        className={icon + " " + iconDown}
                                        icon={<DownIcon />}
                                        {...getToggleButtonProps()}
                                    />*/}
                                    {isOpen && this.renderDropdown(restOfDownshiftProps)}
                                </div>
                            )}
                        </Downshift>
                        <SearchShortcut>/</SearchShortcut>
                    </SearchBarInputWrapper>
                </SearchBarWrapper>
            </Elevation>
        );
    }
}

export default compose(withRouter())(SearchBar);
