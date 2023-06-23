import React, { useCallback, useMemo, useState } from "react";
import { useNavigation } from "@webiny/app-admin";
import styled from "@emotion/styled";
import { useHistory } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin";
import { getTenantId } from "@webiny/app/utils";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";

// @ts-ignore Library doesn't have types.
import { useHotkeys } from "react-hotkeyz";
import { Input } from "@webiny/ui/Input";
import { Typography } from "@webiny/ui/Typography";

interface Item {
    id: string;
    title: string;
    description: string;
    link?: string;
    callback?: () => void | Promise<void>;
}

interface ItemsSection {
    id: string;
    title: string;
    items: Item[];
}

const Dialog = styled.div`
    background-color: rgba(0, 0, 0, 0.32);
    height: 100%;
    width: 100%;
    position: fixed;
    z-index: 2312321;
    top: 0;

    .dialog {
        position: fixed;
        top: 350px;
        left: 50%;
        /* bring your own prefixes */
        transform: translate(-50%, -50%);
        background-color: white;
        width: 700px;
        height: 500px;
        z-index: auto;
        box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14),
            0px 9px 46px 8px rgba(0, 0, 0, 0.12);

        > ul {
            overflow-y: scroll;
            height: 444px;
            margin-bottom: 10px;

            > li {
                .section-title {
                    bottom-bottom: 1px solid var(--mdc-theme-on-background);
                    padding: 10px 15px 5px 15px;
                }

                ul {
                    li {
                        padding: 10px 15px;
                        cursor: pointer;

                        :hover {
                            background-color: var(--mdc-theme-background);
                        }

                        .section-item-title {
                            margin-bottom: 3px;
                            color: var(--mdc-theme-primary);
                        }

                        .section-item-description {
                            color: var(--mdc-theme-text-primary-on-background);
                        }
                    }
                }
            }
        }
    }
`;

export const OmniSearch = () => {
    const { menuItems } = useNavigation();
    const [filter, setFilter] = useState("");
    const [omniSearchVisible, setShowOmniSearch] = useState(false);
    const history = useHistory();
    const { showSnackbar } = useSnackbar();

    const showOmniSearch = useCallback(() => {
        setShowOmniSearch(true);
    }, []);

    const hideOmniSearch = useCallback(() => {
        setShowOmniSearch(false);
        setFilter("");
    }, []);

    const fullItemsList = useMemo<ItemsSection[]>(() => {
        return [
            {
                id: "apps",
                title: "Apps",
                items: menuItems
                    .map(level1Item => {
                        return [
                            ...level1Item.children.map(level2Item => {
                                return [
                                    ...level2Item.children.map(child => {
                                        const description = [
                                            level1Item.label,
                                            level2Item.label
                                        ].join("/");

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
            },
            {
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
        ];
    }, [menuItems]);

    const filteredItemsList = useMemo(() => {
        if (!filter) {
            return fullItemsList;
        }

        const filteredItems = fullItemsList.map(itemsSection => {
            return {
                ...itemsSection,
                items: itemsSection.items.filter(item => {
                    return item.title.toLowerCase().includes(filter.toLowerCase());
                })
            };
        });

        return filteredItems.filter(itemsSection => itemsSection.items.length > 0);
    }, [fullItemsList, filter]);

    const selectItem = useCallback(item => {
        if (item.link) {
            history.push(item.link);
        } else if (item.callback) {
            item.callback();
        }

        hideOmniSearch();
    }, []);

    const selectActiveItem = useCallback(() => {
        if (filteredItemsList.length === 0) {
            return;
        }

        selectItem(filteredItemsList[0].items[0]);
    }, [filteredItemsList]);

    const onClickItem = useCallback(selectItem, []);

    useHotkeys({
        zIndex: 100,
        keys: {
            "cmd+k": showOmniSearch,
            esc: hideOmniSearch
        }
    });

    useHotkeys({
        zIndex: 100,
        keys: {
            enter: selectActiveItem
        },
        disabled: !omniSearchVisible
    });

    if (!omniSearchVisible) {
        return null;
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
                        onChange={setFilter}
                    />
                </div>
                {filteredItemsList.length === 0 && <>Nothing to show.</>}
                {filteredItemsList.length > 0 && (
                    <ul>
                        {filteredItemsList.map(itemsSection => (
                            <li key={itemsSection.id}>
                                <div className={"section-title"}>
                                    <Typography use={"overline"}>{itemsSection.title}</Typography>
                                </div>
                                <div className={"section-items"}>
                                    <ul>
                                        {itemsSection.items.map(item => (
                                            <li key={item.id} onClick={() => onClickItem(item)}>
                                                <div className={"section-item-title"}>
                                                    {item.title}
                                                </div>
                                                <Typography
                                                    use={"caption"}
                                                    className={"section-item-description"}
                                                >
                                                    {item.description}
                                                </Typography>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Dialog>
    );
};
