import * as React from "react";
import { AdminGlobalSearchPlugin } from "~/types";
import classnames from "classnames";
import { List, ListItem, ListItemGraphic, ListItemText, ListItemMeta } from "@webiny/ui/List";
import { searchBarDropdown, iconSearchType } from "./styled";
import { Elevation } from "@webiny/ui/Elevation";
import { Icon } from "@webiny/ui/Icon";
import { Actions as DownshiftActions, DownshiftState, PropGetters } from "downshift";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
import { SearchBarState } from "~/plugins/globalSearch/SearchBar";

interface SearchBarDropdownPropsContextDownshiftCurrent
    extends DownshiftActions<any>,
        PropGetters<any> {
    state: DownshiftState<any>;
}
interface SearchBarDropdownPropsContextDownshift {
    current: SearchBarDropdownPropsContextDownshiftCurrent;
}
interface SearchBarDropdownPropsContext {
    downshift: SearchBarDropdownPropsContextDownshift;
    submitSearchTerm: (item: AdminGlobalSearchPlugin) => void;
    state: SearchBarState;
}
interface SearchBarDropdownProps {
    context: SearchBarDropdownPropsContext;
}
export default class SearchBarDropdown extends React.Component<SearchBarDropdownProps> {
    public override componentDidMount() {
        const {
            context: {
                downshift: { current: downshift },
                state: { plugins }
            }
        } = this.props;

        downshift.selectItem(plugins.current);
        downshift.setHighlightedIndex(
            plugins.list.indexOf(plugins.current as AdminGlobalSearchPlugin)
        );
        downshift.openMenu();
    }

    public override render() {
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
            <Elevation z={2} className={searchBarDropdown}>
                <List {...getMenuProps()}>
                    {plugins.list.map((item: AdminGlobalSearchPlugin, index) => {
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
                                <ListItemGraphic>
                                    <Icon className={iconSearchType} icon={<SearchIcon />} />
                                </ListItemGraphic>
                                <ListItemText>
                                    {searchTerm.current || "Search for all..."}
                                </ListItemText>
                                <ListItemMeta>in {item.label}</ListItemMeta>
                            </ListItem>
                        );
                    })}
                </List>
            </Elevation>
        );
    }
}
