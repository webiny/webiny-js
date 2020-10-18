import * as React from "react";
import { List, ListItem } from "@webiny/ui/List";
import { Link } from "@webiny/react-router";
import useNavigation from "./useNavigation";
import { css } from "emotion";

const linkStyle = css({
    color: "var(--mdc-theme-text-primary-on-background)",
    textDecoration: "none",
    display: "block",
    width: "100%",
    outline: "none",
    paddingLeft: 65,
    "&:hover": {
        textDecoration: "none"
    }
});

const submenuItems = css({
    ".mdc-drawer &.mdc-list-item": {
        paddingLeft: 0
    }
});

const submenuList = css({
    "&.mdc-list": {
        padding: 0
    }
});

type Props = {
    label: React.ReactNode;
    path: string;
    style?: React.CSSProperties;
    onClick?: () => any;
};

export default function Item(props: Props) {
    const { path, label, style, onClick } = props;
    const { hideMenu } = useNavigation();
    return (
        <List className={submenuList} style={style}>
            <ListItem className={submenuItems}>
                {path ? (
                    <Link className={linkStyle} to={path} onClick={hideMenu}>
                        {label}
                    </Link>
                ) : (
                    <span onClick={onClick} className={linkStyle}>
                        {label}
                    </span>
                )}
            </ListItem>
        </List>
    );
}
