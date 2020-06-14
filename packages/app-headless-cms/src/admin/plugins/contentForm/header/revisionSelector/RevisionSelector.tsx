import React from "react";
import { css } from "emotion";
import { useRouter } from "@webiny/react-router";
import { ButtonDefault } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { get } from "lodash";

const buttonStyle = css({
    "&.mdc-button": {
        color: "var(--mdc-theme-text-primary-on-background) !important"
    }
});

const menuList = css({
    ".mdc-list-item": {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "baseline",
        textAlign: "left"
    }
});

const RevisionSelector = ({ entry }) => {
    const { location, history } = useRouter();
    const query = new URLSearchParams(location.search);

    return (
        <Menu
            className={menuList}
            onSelect={evt => {
                query.set("id", entry.revisions[evt.detail.index].id);
                history.push({ search: query.toString() });
            }}
            handle={
                <ButtonDefault className={buttonStyle}>v{get(entry, "meta.version")}</ButtonDefault>
            }
        >
            {(get(entry, "meta.revisions") || []).map(rev => {
                return (
                    <MenuItem key={rev.id}>
                        <Typography use={"body2"}>v{get(rev, "meta.version")}</Typography>
                        <Typography use={"caption"}>({get(rev, "meta.status")})</Typography>
                    </MenuItem>
                );
            })}
        </Menu>
    );
};

export default RevisionSelector;
