//@flow
import React from "react";
import { Menu, MenuItem } from "webiny-ui/Menu";
import { css } from "emotion";
import { ButtonDefault } from "webiny-ui/Button";
import { Icon } from "webiny-ui/Icon";
import { ReactComponent as DownButton } from "webiny-app-cms/editor/assets/icons/round-arrow_drop_down-24px.svg";
import { Typography } from "webiny-ui/Typography";

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

const Revisions = () => {
    return (
        <Menu
            className={menuList}
            handle={
                <ButtonDefault className={buttonStyle}>
                    Revisions <Icon icon={<DownButton />} />
                </ButtonDefault>
            }
        >
            <MenuItem>
                <Typography use={"body2"}>Revision 5</Typography>
                <Typography use={"caption"}>(draft)</Typography>
            </MenuItem>
            <MenuItem>
                <Typography use={"body2"}>Revision 4</Typography>
                <Typography use={"caption"}>(published)</Typography>
            </MenuItem>
            <MenuItem>
                <Typography use={"body2"}>Revision 3</Typography>
                <Typography use={"caption"}>(published)</Typography>
            </MenuItem>
            <MenuItem>
                <Typography use={"body2"}>Revision 2</Typography>
                <Typography use={"caption"}>(published)</Typography>
            </MenuItem>
            <MenuItem>
                <Typography use={"body2"}>Revision 1</Typography>
                <Typography use={"caption"}>(published)</Typography>
            </MenuItem>
        </Menu>
    );
};

export default Revisions;
