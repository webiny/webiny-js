import React, { Fragment } from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import classSet from "classnames";

import webinyLogo from "../../assets/images/webiny-orange-logo.svg";
import signInDivider from "./assets/sign-in-divider.svg";
import { config as appConfig } from "@webiny/app/config";

const SidebarWrapper = styled("div")({});

const Logo = styled("div")({
    padding: 15,
    borderBottom: "1px solid var(--mdc-theme-background)",
    img: {
        width: "100px",
        height: "auto"
    }
});

const List = styled("ul")({
    li: {
        display: "flex",
        alignItems: "center",
        padding: "15px 15px",
        ".status": {
            borderRadius: "50%",
            display: "inline-block",
            height: 20,
            width: 20,
            marginRight: 15
        },
        "&.sign-in": {
            display: "block",
            textAlign: "center",
            ".note": {
                display: "inline-block",
                lineHeight: "150%",
                fontSize: 10,
                paddingTop: 10,
                color: "var(--mdc-theme-text-icon-on-background)"
            },
            img: {
                width: "100%"
            }
        },
        "&.active": {
            backgroundColor: "var(--mdc-theme-background)",
            fontWeight: 600,
            ".status": {
                backgroundColor: "var(--mdc-theme-primary)"
            }
        },
        "&.pending": {
            ".status": {
                backgroundColor: "var(--mdc-theme-on-surface)"
            }
        },
        "&.installed": {
            ".status": {
                backgroundColor: "var(--mdc-theme-secondary)"
            }
        }
    }
});

const Note = styled("div")({
    padding: 15
});

const Installations = ({ title, allInstallers, installer, showLogin }) => {
    const renderList = () => {
        const loginItem = (
            <li key={"login"} className={"sign-in"}>
                <img src={signInDivider} />
                <Typography use={"overline"} className={"note"}>
                    TO CONTINUE THE INSTALLATION AFTER THIS POINT YOU’LL NEED TO SIGN IN
                </Typography>
            </li>
        );

        const items = [];
        for (let i = 0; i < allInstallers.length; i++) {
            const { name, title, secure, installed } = allInstallers[i];
            const prev = i === 0 ? null : allInstallers[i - 1];
            if ((!prev || !prev.secure) && secure && showLogin) {
                items.push(loginItem);
            }

            const active = installer && !showLogin && name === installer.name;

            items.push(
                <li
                    key={name}
                    className={classSet(
                        { installed: installed },
                        { active: active },
                        { pending: !installed && !active }
                    )}
                >
                    <span className={"status"} />
                    <span className={"title"}>{title}</span>
                </li>
            );
        }
        return items;
    };

    return (
        <Fragment>
            <Note>
                <Typography use={"body1"}>{title}</Typography>
            </Note>
            <List>{renderList()}</List>
        </Fragment>
    );
};

const Sidebar = ({ allInstallers, installer, showLogin }) => {
    const upgrades = allInstallers.filter(installer => installer.type === "upgrade");
    const installations = allInstallers.filter(installer => installer.type === "install");

    const wbyVersion = appConfig.getKey("WEBINY_VERSION", process.env.REACT_APP_WEBINY_VERSION);

    return (
        <SidebarWrapper>
            <Logo>
                <img src={webinyLogo} alt="Webiny CMS" />
            </Logo>
            {upgrades.length > 0 ? (
                <Installations
                    title={
                        <span>
                            The following apps will be upgraded to <strong>{wbyVersion}</strong>:
                        </span>
                    }
                    allInstallers={upgrades}
                    installer={installer}
                    showLogin={showLogin}
                />
            ) : null}
            {installations.length > 0 && (
                <Installations
                    title={"The following apps will be installed and configured:"}
                    allInstallers={installations}
                    installer={installer}
                    showLogin={upgrades.length > 0 ? false : showLogin}
                />
            )}
        </SidebarWrapper>
    );
};
export default Sidebar;
