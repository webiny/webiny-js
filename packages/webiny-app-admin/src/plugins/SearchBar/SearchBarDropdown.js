//@flow
import * as React from "react";
import type { GlobalSearch } from "webiny-app-admin/types";
import classnames from "classnames";
import { List, ListItem, ListItemGraphic, ListItemText, ListItemMeta } from "webiny-ui/List";
import { searchBarDropdown } from "./styled";

export default class SearchBarDropdown extends React.Component<*> {
    componentDidMount() {
        const {
            context: {
                downshift: { current: downshift },
                state: { plugins }
            }
        } = this.props;

        downshift.selectItem(plugins.current);
        downshift.setHighlightedIndex(plugins.list.indexOf(plugins.current));
        downshift.openMenu();
    }

    render() {
        const {
            context: {
                downshift: { current: downshift },
                submitSearchTerm,
                state: { plugins, searchTerm }
            }
        } = this.props;

        const {
            getMenuProps,
            getItemProps,
            state: { selectedItem, highlightedIndex }
        } = downshift;

        return (
            <List {...getMenuProps({ className: searchBarDropdown })}>
                {plugins.list.map((item: GlobalSearch, index) => {
                    // Base classes.
                    const itemClassNames = {
                        highlighted: highlightedIndex === index,
                        selected: false
                    };

                    // Add "selected" class if the item is selected.
                    if (selectedItem && selectedItem === item) {
                        itemClassNames.selected = true;
                    }

                    return (
                        <ListItem
                            key={item.route}
                            {...getItemProps({
                                index,
                                item,
                                className: classnames(itemClassNames),
                                onClick: () => submitSearchTerm(item)
                            })}
                        >
                            <ListItemGraphic>➡</ListItemGraphic>
                            <ListItemText>{searchTerm.current || "Search for all..."}</ListItemText>
                            <ListItemMeta>in {item.label}</ListItemMeta>
                        </ListItem>
                    );
                })}
            </List>
        );
    }
}
