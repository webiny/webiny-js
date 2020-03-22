import React from "react";
import { HeaderRightPlugin } from "@webiny/app-admin/types";
import { css } from "emotion";
import { Menu } from "@webiny/ui/Menu";
import { List, ListItem } from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { Link } from "@webiny/react-router";
import { ButtonPrimary } from "@webiny/ui/Button";
import { useCms } from "@webiny/app-headless-cms/admin/contexts/Cms";
const t = i18n.ns("app-headless-cms/admin/top-environment-selector");

const menuDialog = css({
    minWidth: 300
});

const EnvironmentSelector = function() {
    const {
        environments: { currentEnvironment, environments, selectEnvironment }
    } = useCms();

    return (
        <Menu
            anchor={"topEnd"}
            handle={
                <ButtonPrimary>
                    {currentEnvironment ? currentEnvironment.name : t`...`}
                </ButtonPrimary>
            }
        >
            <List data-testid="cms-environments-menu-list" className={menuDialog}>
                {environments.map(item => (
                    <ListItem key={item.id} onClick={() => selectEnvironment(item)}>
                        {item.name}{" "}
                        {item.default && <Typography use={"overline"}>{t`(default)`}</Typography>}
                    </ListItem>
                ))}
                <hr />
                <ListItem>
                    <Link to={"/cms/environments"}>{t`View all`}</Link>
                </ListItem>
            </List>
        </Menu>
    );
};

const plugin: HeaderRightPlugin = {
    name: "header-right-cms-environment-selector",
    type: "header-right",
    render() {
        return <EnvironmentSelector />;
    }
};

export default plugin;
