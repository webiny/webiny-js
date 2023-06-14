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

    const allMenuItems = menuItems
        .map(level1Item => {
            return [
                ...level1Item.children.map(level2Item => {
                    return [
                        ...level2Item.children.map(child => {
                            return {
                                label: child.label,
                                path: child.path,
                                breadcrumb: [level1Item.label, level2Item.label]
                            };
                        })
                    ];
                })
            ].flat();
        })
        .flat();

    const filteredItems = useMemo(() => {
        return allMenuItems.filter(item => {
            // @ts-ignore
            return item.label?.toLowerCase().includes(filter.toLowerCase());
        });
    }, [filter]);

    const selectActive = useCallback(() => {
        if (filteredItems.length === 0) {
            return;
        }

        hideOmniSearch();

        // @ts-ignore
        history.push(filteredItems[0].path);
        return;
    }, [filteredItems]);

    const copyTenantId = useCallback(() => {
        navigator.clipboard.writeText(getTenantId()!);
        showSnackbar("Tenant ID copied to clipboard.");
        hideOmniSearch();
    }, []);

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
            enter: selectActive
        },
        disabled: !omniSearchVisible
    });

    if (omniSearchVisible) {
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
                    <ul>
                        {filteredItems.length > 0 && (
                            <li>
                                <div className={"section-title"}>
                                    <Typography use={"overline"}>Apps</Typography>
                                </div>
                                <div className={"section-items"}>
                                    <ul>
                                        {filteredItems.map(item => (
                                            <li key={item.path}>
                                                <div className={"section-item-title"}>
                                                    {item.label}
                                                </div>
                                                <Typography
                                                    use={"caption"}
                                                    className={"section-item-description"}
                                                >
                                                    {item.breadcrumb.join(" / ")}
                                                </Typography>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        )}

                        <li>
                            <div className={"section-title"}>
                                <Typography use={"overline"}>Development</Typography>
                            </div>
                            <div className={"section-items"}>
                                <ul>
                                    <li onClick={copyTenantId}>
                                        <div className={"section-item-title"}>
                                            Copy current tenant ID
                                        </div>
                                        <Typography
                                            use={"caption"}
                                            className={"section-item-description"}
                                        >
                                            Copies current tenant ID into clipboard.
                                        </Typography>
                                    </li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                </div>
            </Dialog>
        );
    }

    return null;
};
