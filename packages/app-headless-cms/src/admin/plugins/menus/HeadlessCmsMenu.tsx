import React, { useState } from "react";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/menus");
import { ReactComponent as HeadlessCmsIcon } from "../../icons/devices_other-black-24px.svg";
import { ReactComponent as EnvironmentIcon } from "../../icons/call_split-24px.svg";
import { Typography } from "@webiny/ui/Typography";
import { css } from "emotion";
import EnvironmentSelectorDialog from "./../../components/EnvironmentSelectorDialog";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";

const style = {
    itemsList: css({
        paddingTop: 10,
        paddingBottom: 10,
        "> li": {
            display: "flex",
            alignItems: "center",
            paddingTop: 2,
            paddingBottom: 2
        }
    }),
    icon: css({
        width: 16,
        height: 16
    }),
    environmentLi: css({
        color: "var(--mdc-theme-text-secondary-on-background)"
    }),
    environmentLiIcon: css({
        width: 16,
        height: 16
    }),
    environmentLiLabel: css({
        marginLeft: 2,
        width: 110,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    }),
    changeEnvironmentLiLink: css({
        color: "var(--mdc-theme-primary)"
    })
};

const HeadlessCmsMenu = ({ Menu, children }) => {
    const [dialogOpened, setDialogOpened] = useState(false);

    const {
        environments: { currentEnvironment }
    } = useCms();

    return (
        <Menu
            onClick={toggleMenu => !dialogOpened && toggleMenu()}
            name="headless-cms"
            icon={<HeadlessCmsIcon />}
            label={
                <ul className={style.itemsList}>
                    <li>{t`Headless CMS`}</li>
                    <li className={style.environmentLi}>
                        <EnvironmentIcon className={style.environmentLiIcon} />
                        <Typography use={"caption"} className={style.environmentLiLabel}>
                            {currentEnvironment ? currentEnvironment.name : t`N/A`}
                        </Typography>
                    </li>
                    <li>
                        <Typography use={"caption"}>
                            <div
                                className={style.changeEnvironmentLiLink}
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDialogOpened(true);
                                }}
                            >{t`Change environment`}</div>
                        </Typography>
                        <EnvironmentSelectorDialog
                            open={dialogOpened}
                            onClose={() => setDialogOpened(false)}
                        />
                    </li>
                </ul>
            }
        >
            {children}
        </Menu>
    );
};

export default HeadlessCmsMenu;
