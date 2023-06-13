import React, { useCallback, useMemo, useState } from "react";
import { useNavigation } from "@webiny/app-admin";
import styled from "@emotion/styled";
import { Link, useHistory } from "@webiny/react-router";

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
    top: 300px;
    left: 50%;
    /* bring your own prefixes */
    transform: translate(-50%, -50%);
    background-color: white;
    width: 700px;
    height: 500px;
    z-index: auto;
    box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12);

    ul {
      overflow-y: scroll;
      height: 444px;

      li {
        padding: 15px 15px 10px 15px
      }
    }
  }
`;

export const OmniSearch = () => {
    const { menuItems } = useNavigation();
    const [filter, setFilter] = useState("");
    const [omniSearchVisible, setShowOmniSearch] = useState(false);
    const history = useHistory();

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

    useHotkeys({
        zIndex: 100,
        keys: {
            "cmd+k": showOmniSearch,
            esc: hideOmniSearch,
        },
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
                    <Input
                        placeholder={"Search..."}
                        autoFocus
                        value={filter}
                        onChange={setFilter}
                    />
                    <ul>
                        {filteredItems.map(item => {
                            return (
                                <li key={item.path}>
                                    <div>
                                        {/* @ts-ignore*/}
                                        <Link to={item.path} onClick={hideOmniSearch}>
                                            {item.label}
                                        </Link>
                                    </div>
                                    <div>
                                        <Typography use={"caption"}>
                                            {item.breadcrumb.join(" / ")}
                                        </Typography>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </Dialog>
        );
    }

    return null;
};
