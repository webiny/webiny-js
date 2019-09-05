import React from "react";
import { css } from "emotion";
import useReactRouter from "use-react-router";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as DownButton } from "./icons/round-arrow_drop_down-24px.svg";
import { useFormEditor } from "@webiny/app-forms/admin/components/FormEditor/Context";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("FormEditor.RevisionsMenu");

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
    const {
        state: { data }
    } = useFormEditor();

    const { history } = useReactRouter();

    const revisions = data.revisions || [];
    return (
        <Menu
            className={menuList}
            onSelect={evt => {
                history.push(`/forms/${revisions[evt.detail.index].id}`);
            }}
            handle={
                <ButtonDefault className={buttonStyle}>
                    {t`Revisions`} <Icon icon={<DownButton />} />
                </ButtonDefault>
            }
        >
            {revisions.map(rev => (
                <MenuItem key={rev.id} disabled={rev.status !== "draft"}>
                    <Typography use={"body2"}>v{rev.version}</Typography>
                    <Typography use={"caption"}>({rev.status})</Typography>
                </MenuItem>
            ))}
        </Menu>
    );
};

export default React.memo(Revisions);
