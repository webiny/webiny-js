import React from "react";
import { css } from "emotion";
import { Icon } from "@webiny/ui/Icon";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as PermissionIcon } from "@material-design-icons/svg/outlined/privacy_tip.svg";
import { Typography } from "@webiny/ui/Typography";

const t = i18n.ns("app-admin/file-manager/file-manager-view/no-permission");

const styles = css({
    margin: "0 auto",
    paddingTop: 0,
    height: "100%",
    zIndex: 2,
    width: "100%",
    position: "absolute",
    backgroundColor: "transparent",
    "& .outer-container": {
        textAlign: "center",
        width: 300,
        height: 300,
        backgroundColor: "var(--mdc-theme-surface)",
        borderRadius: "50%",
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translateX(-50%) translateY(-100%)",
        "& .inner-container": {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 35,
            width: 300,
            color: "var(--mdc-theme-on-surface)",
            "svg.mdc-button__icon": {
                width: 100,
                display: "inline-block",
                color: "var(--mdc-theme-on-surface)"
            },
            "& .title": {
                marginTop: 8
            },
            "& .body": {
                color: "var(--mdc-theme-text-secondary-on-background)"
            }
        }
    }
});

const NoPermissionView: React.FC = () => {
    return (
        <div className={styles}>
            <div className={"outer-container"}>
                <div className={"inner-container"}>
                    <Icon icon={<PermissionIcon />} />
                    <Typography
                        className={"title"}
                        use={"subtitle1"}
                    >{t`Permission needed`}</Typography>
                    <Typography className={"body"} use={"body2"}>
                        {t`You're missing required permission to access files. Please contact the administrator.`}
                    </Typography>
                </div>
            </div>
        </div>
    );
};

export default NoPermissionView;
