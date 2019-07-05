//@flow
import React from "react";
import { css } from "emotion";
import { withRouter } from "react-router-dom";
import { type WithFormDetailsProps } from "webiny-app-cms/admin/components";
import { ButtonDefault } from "webiny-ui/Button";
import { Icon } from "webiny-ui/Icon";
import { ReactComponent as DownButton } from "webiny-app-cms/admin/assets/round-arrow_drop_down-24px.svg";
import { MenuItem } from "@rmwc/menu";
import { Typography } from "webiny-ui/Typography";
import { Menu } from "webiny-ui/Menu";
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

type Props = WithFormDetailsProps;

const RevisionSelector = ({ revision, form, onSelectRevision }: Props) => {
    return (
        <Menu
            className={menuList}
            onSelect={evt => onSelectRevision(form.revisions[evt.detail.index])}
            handle={
                <ButtonDefault className={buttonStyle}>
                    v{revision.version} <Icon icon={<DownButton />} />
                </ButtonDefault>
            }
        >
            {(get(form, "revisions") || []).map(rev => (
                <MenuItem key={rev.id}>
                    <Typography use={"body2"}>v{rev.version}</Typography>
                    <Typography use={"caption"}>({rev.status})</Typography>
                </MenuItem>
            ))}
        </Menu>
    );
};

export default withRouter(RevisionSelector);
