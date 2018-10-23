//@flow
import * as React from "react";
import { compose } from "recompose";
import Downshift from "downshift";
import { getPlugins } from "webiny-app/plugins";
import { withRouter } from "webiny-app/components";
import type { SearchPlugin } from "webiny-app-admin/types";
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
    SearchBarInput,
    SearchShortcut,
    searchBarDropdown,
    icon,
    searchWrapper
} from "./styled";

type State = {
    active: boolean,
    value: ""
};

class SearchBar extends React.Component<*, State> {
    plugins: Array<SearchPlugin> = getPlugins("global-search");

    state = {
        active: false,
        value: "",
        previousValue: ""
    };

    renderDropdown({ getMenuProps, getItemProps, selectedItem, highlightedIndex }) {
        return (
            <List {...getMenuProps({ className: searchBarDropdown })}>
                {this.plugins.map((item: SearchPlugin, index) => {
                    // Base classes.
                    const itemClassNames = {
                        highlighted: highlightedIndex === index,
                        selected: false
                    };

                    // Add "selected" class if the item is selected.
                    if (selectedItem && selectedItem.route === item.route) {
                        itemClassNames.selected = true;
                    }

                    console.log(itemClassNames)

                    return (
                        <ListItem
                            {...getItemProps({
                                index,
                                item,
                                className: classnames(itemClassNames)
                            })}
                            key={item.route}
                        >
                            <ListItemGraphic>></ListItemGraphic>
                            <ListItemText>{this.state.value}</ListItemText>
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

                        <Downshift itemToString={item => item && item.label}>
                            {({
                                selectedItem,
                                isOpen,
                                openMenu,
                                closeMenu,
                                getInputProps,
                                ...restOfDownshiftProps
                            }) => (
                                <div>
                                    <SearchBarInput
                                        {...getInputProps({
                                            value: this.state.value,
                                            onChange: e => {
                                                const value = e.target.value || "";
                                                if (this.state.value !== value) {
                                                    this.setState({ value: value });
                                                }
                                            },
                                            onKeyDown: e => {
                                                const key = keycode(e);
                                                if (key === "esc") {
                                                    closeMenu();
                                                    return;
                                                }

                                                if (key === "enter") {
                                                    console.log(selectedItem)
                                                    if (!selectedItem) {
                                                        return;
                                                    }

                                                    const route = {
                                                        name: selectedItem.route,
                                                        merge: true,
                                                        params: {}
                                                    };

                                                    if (this.state.value) {
                                                        route.params.search = JSON.stringify({
                                                            query: this.state.value,
                                                            fields: "name"
                                                        });
                                                    }

                                                    this.props.router.goToRoute(route);
                                                }
                                            },
                                            onFocus: () => {
                                                this.setState({ active: true });
                                                openMenu();
                                            },
                                            onBlur: () => {
                                                this.setState({ active: false });
                                            },
                                            className: "mdc-text-field__input",
                                            placeholder: "Search..."
                                        })}
                                    />

                                    {isOpen &&
                                        this.state.value.length > 0 &&
                                        this.renderDropdown(restOfDownshiftProps)}
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
