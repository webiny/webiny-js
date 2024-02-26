import React, { useCallback, useMemo, useState } from "react";
import { useNavigation } from "@webiny/app-admin";
import { useNavigate } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin";
import { getTenantId } from "@webiny/app/utils";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";
/**
 * Library does not have types.
 */
// @ts-expect-error
import { useHotkeys } from "react-hotkeyz";
import { Input } from "@webiny/ui/Input";
import { Typography } from "@webiny/ui/Typography";

import { Dialog } from "./OmniSearch/Dialog";

interface Item {
    id: string;
    title: string;
    description: string;
    link?: string;
    callback?: () => void | Promise<void>;
    render?: () => React.ReactElement;
}

interface ItemsSection {
    id: string;
    title: string;
    items: Item[];
}

interface IndexedItem extends Item {
    index: number;
}

interface IndexedItemsSection extends Omit<ItemsSection, "items"> {
    id: string;
    title: string;
    items: IndexedItem[];
}

const getIndexedItemsList = (items: ItemsSection[]): IndexedItemsSection[] => {
    let lastUsedItemIndex = 0;
    return items.map(itemsSection => {
        return {
            ...itemsSection,
            items: itemsSection.items.map(item => {
                const index = lastUsedItemIndex++;
                return {
                    ...item,
                    index
                };
            })
        };
    });
};

const getItemFromIndexedItemsList = (
    itemsSections: IndexedItemsSection[],
    index: number
): IndexedItem | null => {
    if (index < 0) {
        return null;
    }

    for (let i = 0; i < itemsSections.length; i++) {
        const itemsSection = itemsSections[i];
        for (let j = 0; j < itemsSection.items.length; j++) {
            const item = itemsSection.items[j];
            if (item.index === index) {
                return item;
            }
        }
    }

    return null;
};

export const OmniSearch = () => {
    const [omniSearchVisible, setShowOmniSearch] = useState(false);
    const [itemRender, setItemRender] = useState<() => React.ReactElement>();
    const [filter, setFilter] = useState("");
    const [focusedItemIndex, focusItemAtIndex] = useState(0);
    const { menuItems } = useNavigation();
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const showOmniSearch = useCallback(() => {
        setShowOmniSearch(true);
    }, []);

    const hideOmniSearch = useCallback(() => {
        setShowOmniSearch(false);
        setItemRender(undefined);
        setFilter("");
    }, []);

    const onFilter = useCallback(searchString => {
        setFilter(searchString);
        focusItemAtIndex(0);
    }, []);

    const selectItem = useCallback((item: Item) => {
        if (item.link) {
            navigate(item.link);
            hideOmniSearch();
            return;
        }

        if (item.callback) {
            item.callback();
            hideOmniSearch();
            return;
        }

        if (item.render) {
            setFilter("");
            setItemRender(() => item.render);
        }
    }, []);

    // TODO: should be pulled from registered plugins.
    const fullItemsList = useMemo<ItemsSection[]>(() => {
        return [
            {
                id: "apps",
                title: "Apps",
                items: [
                    ...menuItems
                        .map(level1Item => {
                            return [
                                ...level1Item.children.map(level2Item => {
                                    return [
                                        ...level2Item.children.map(child => {
                                            const description = [
                                                level1Item.label,
                                                level2Item.label
                                            ].join(" / ");

                                            return {
                                                id: description + child.label,
                                                title: child.label!,
                                                description,
                                                link: child.path
                                            };
                                        })
                                    ];
                                })
                            ].flat();
                        })
                        .flat()
                ]
            },
            {
                id: "other",
                title: "Other",
                items: [
                    {
                        id: "back",
                        title: "← Back",
                        description: "Navigates to the previous page.",
                        callback: () => {
                            navigate(-1);
                        }
                    }
                ]
            },
            getTenantId() && {
                id: "development",
                title: "Development",
                items: [
                    {
                        id: "copy-tenant-id",
                        title: "Copy current tenant ID",
                        description: "Copies current tenant ID into clipboard.",
                        callback: () => {
                            navigator.clipboard.writeText(getTenantId()!);
                            showSnackbar("Tenant ID copied to clipboard.");
                        }
                    }
                ]
            }
        ].filter(Boolean) as ItemsSection[];
    }, [menuItems]);

    const filteredIndexedItemsList = useMemo(() => {
        if (!filter) {
            return getIndexedItemsList(fullItemsList);
        }

        const filteredItems1stPass = fullItemsList.map(itemsSection => {
            return {
                ...itemsSection,
                items: itemsSection.items.filter(item => {
                    return item.title?.toLowerCase().includes(filter.toLowerCase());
                })
            };
        });

        const filteredItems2ndPass = filteredItems1stPass.filter(
            itemsSection => itemsSection.items.length > 0
        );

        return getIndexedItemsList(filteredItems2ndPass);
    }, [fullItemsList, filter]);

    const selectFocusedItem = useCallback(() => {
        const focusedItem = getItemFromIndexedItemsList(filteredIndexedItemsList, focusedItemIndex);
        if (focusedItem) {
            selectItem(focusedItem);
        }
    }, [filteredIndexedItemsList, focusedItemIndex]);

    const focusNextItem = useCallback(() => {
        const nextIndex = focusedItemIndex + 1;
        const itemToFocus = getItemFromIndexedItemsList(filteredIndexedItemsList, nextIndex);
        if (itemToFocus) {
            focusItemAtIndex(itemToFocus.index);
        }
    }, [filteredIndexedItemsList, focusedItemIndex]);

    const focusPrevItem = useCallback(() => {
        const prevIndex = focusedItemIndex - 1;
        const itemToFocus = getItemFromIndexedItemsList(filteredIndexedItemsList, prevIndex);
        if (itemToFocus) {
            focusItemAtIndex(itemToFocus.index);
        }
    }, [filteredIndexedItemsList, focusedItemIndex]);

    useHotkeys({
        zIndex: 1000,
        keys: {
            "mod+k": showOmniSearch,
            esc: hideOmniSearch
        }
    });

    useHotkeys({
        zIndex: 1000,
        keys: {
            enter: selectFocusedItem,
            arrowUp: focusPrevItem,
            arrowDown: focusNextItem
        },
        disabled: !omniSearchVisible
    });

    if (!omniSearchVisible) {
        return null;
    }

    let renderedResults = <>Nothing to show.</>;
    if (itemRender) {
        renderedResults = itemRender();
    } else if (filteredIndexedItemsList.length > 0) {
        renderedResults = (
            <ul>
                {filteredIndexedItemsList.map(itemsSection => (
                    <li key={itemsSection.id}>
                        <div className={"section-title"}>
                            <Typography use={"overline"}>{itemsSection.title}</Typography>
                        </div>
                        <div className={"section-items"}>
                            <ul>
                                {itemsSection.items.map(item => {
                                    const isFocused = item.index === focusedItemIndex;
                                    return (
                                        <li
                                            className={isFocused ? "focused" : ""}
                                            key={item.id}
                                            onClick={() => selectFocusedItem()}
                                            onMouseEnter={() => focusItemAtIndex(item.index)}
                                        >
                                            <div className={"section-item-title"}>{item.title}</div>
                                            <Typography
                                                use={"caption"}
                                                className={"section-item-description"}
                                            >
                                                {item.description}
                                            </Typography>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <Dialog>
            <div className={"dialog"}>
                <div className={"search-input"}>
                    <Input
                        icon={<SearchIcon />}
                        placeholder={"Search..."}
                        autoFocus
                        value={filter}
                        onChange={onFilter}
                    />
                </div>
                {renderedResults}
            </div>
        </Dialog>
    );
};
