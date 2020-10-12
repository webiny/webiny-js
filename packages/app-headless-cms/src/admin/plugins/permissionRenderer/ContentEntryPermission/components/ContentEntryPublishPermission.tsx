import React, { Fragment } from "react";
import { css } from "emotion";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { Switch } from "@webiny/ui/Switch";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const flexClass = css({
    display: "flex",
    alignItems: "center"
});

export const ContentEntryPublishPermission = ({ value, setValue }) => {
    return (
        <Fragment>
            <Cell span={6}>
                <div className={flexClass}>
                    <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
                    <Typography use={"subtitle2"}>{t`User can publish content`}</Typography>
                </div>
            </Cell>
            <Cell span={6} align={"middle"}>
                <Switch
                    value={value.canPublish}
                    onChange={value => setValue("canPublish", value)}
                />
            </Cell>
        </Fragment>
    );
};
