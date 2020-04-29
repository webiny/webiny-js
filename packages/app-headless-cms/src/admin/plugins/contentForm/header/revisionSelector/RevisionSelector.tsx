import React from "react";
import { css } from "emotion";
import { withRouter } from "@webiny/react-router";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as DownButton } from "@webiny/app-page-builder/admin/assets/round-arrow_drop_down-24px.svg";
import { MenuItem } from "@rmwc/menu";
import { Typography } from "@webiny/ui/Typography";
import { Menu } from "@webiny/ui/Menu";
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

const RevisionSelector = ({ location, history, entry }) => {
    const query = new URLSearchParams(location.search);

    return (
        <Menu
            className={menuList}
            onSelect={evt => {
                query.set("id", entry.revisions[evt.detail.index].id);
                history.push({ search: query.toString() });
            }}
            handle={
                <ButtonDefault className={buttonStyle}>
                    v{get(entry, "meta.version")} <Icon icon={<DownButton />} />
                </ButtonDefault>
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

export default withRouter(RevisionSelector);
