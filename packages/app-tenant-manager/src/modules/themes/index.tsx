import React, { Fragment, memo } from "react";
import gql from "graphql-tag";
import { Provider, Plugins } from "@webiny/app-admin";
import { AddPbWebsiteSettings } from "@webiny/app-page-builder";
import { AddTenantFormField } from "~/components/AddTenantFormField";
import { ThemeCheckboxGroup } from "~/components/ThemeCheckboxGroup";
import { ThemeManagerProviderHOC } from "./ThemeManagerProvider";
import { IsRootTenant, IsNotRootTenant } from "~/components/IsRootTenant";
import { useBind } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { useThemeManager } from "~/hooks/useThemeManager";
import { useTenantThemes } from "~/hooks/useTenantThemes";
import { validation } from "@webiny/validation";

const { Group, Element } = AddPbWebsiteSettings;

const TenantFormFields = memo(function TenantFormFields() {
    const selection = gql`
        {
            settings {
                themes
            }
        }
    `;

    return <AddTenantFormField querySelection={selection} element={<ThemeCheckboxGroup />} />;
});

const AllThemes = () => {
    const { themes } = useThemeManager();

    return <ThemeSelect themes={themes} />;
};

const TenantThemes = () => {
    const themes = useTenantThemes();

    return <ThemeSelect themes={themes} />;
};

const ThemeSelect = ({ themes }) => {
    const bind = useBind({
        name: "theme",
        defaultValue: "",
        validators: validation.create("required")
    });

    return (
        <Select
            label="Theme"
            description={"Select a theme to use for your website."}
            {...bind}
            value={bind.value || ""}
        >
            {[{ name: "", label: null, hidden: true }, ...themes].map(theme => (
                <option key={theme.name} value={theme.name} hidden={theme.hidden}>
                    {theme.label}
                </option>
            ))}
        </Select>
    );
};

const WebsiteSettings = () => {
    const selection = gql`
        {
            theme
        }
    `;

    return (
        <Group name={"theme"} label={"Theme"} querySelection={selection}>
            <Element>
                <IsNotRootTenant>
                    <TenantThemes />
                </IsNotRootTenant>
                <IsRootTenant>
                    <AllThemes />
                </IsRootTenant>
            </Element>
        </Group>
    );
};

export const ThemesModule = () => {
    return (
        <Fragment>
            <Provider hoc={ThemeManagerProviderHOC} />
            <Plugins>
                <TenantFormFields />
                <WebsiteSettings />
            </Plugins>
        </Fragment>
    );
};
