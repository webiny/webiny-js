import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import classSet from "classnames";

import webinyLogo from "../../assets/images/webiny-orange-logo.svg";
import signInDivider from "./assets/sign-in-divider.svg";

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

const Sidebar = ({ allInstallers, installer, showLogin }) => {
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
            const { plugin, installed } = allInstallers[i];
            const prev = i === 0 ? null : allInstallers[i - 1].plugin;
            if ((!prev || !prev.secure) && plugin.secure) {
                items.push(loginItem);
            }

            let active = installer && !showLogin && plugin.name === installer.plugin.name;

            items.push(
                <li
                    key={plugin.name}
                    className={classSet(
                        { installed: installed },
                        { active: active },
                        { pending: !installed && !active }
                    )}
                >
                    <span className={"status"} />
                    <span className={"title"}>{plugin.title}</span>
                </li>
            );
        }
        return items;
    };

    return (
        <SidebarWrapper>
            <Logo>
                <img src={webinyLogo} alt="Webiny CMS" />
            </Logo>
            <Note>
                <Typography use={"body1"}>
                    The following apps will be installed and configured:
                </Typography>
            </Note>
            <List>{renderList()}</List>
        </SidebarWrapper>
    );
};
export default Sidebar;
