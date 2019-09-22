// @flow
import * as React from "react";
import { List, ListItem } from "@webiny/ui/List";
import { Link } from "react-router-dom";
import useNavigation from "./useNavigation";
import { css } from "emotion";

const linkStyle = css({
    color: "var(--mdc-theme-text-primary-on-background)",
    textDecoration: "none"
});

const submenuItems = css({
    ".mdc-drawer &.mdc-list-item": {
        paddingLeft: 65
    }
});

const submenuList = css({
    "&.mdc-list": {
        padding: 0
    }
});

type Props = { label: React.Node, path: string };

export default function Item(props: Props) {
    const { path, label } = props;
    const { hideMenu } = useNavigation();
    return (
        <React.Fragment>
            <List className={submenuList}>
                <ListItem className={submenuItems}>
                    <Link className={linkStyle} to={path} onClick={hideMenu}>
                        {label}
                    </Link>
                </ListItem>
            </List>
        </React.Fragment>
    );
}
