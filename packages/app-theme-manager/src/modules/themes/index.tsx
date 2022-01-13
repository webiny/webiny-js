import React, { Fragment, memo, useEffect, useRef } from "react";
import gql from "graphql-tag";
import { Provider, Plugins } from "@webiny/app-admin";
import { AddPbWebsiteSettings } from "@webiny/app-page-builder";
import { AddTenantFormField, IsRootTenant, IsNotRootTenant } from "@webiny/app-tenant-manager";
import { useBind } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { validation } from "@webiny/validation";
import { ThemeCheckboxGroup } from "~/components/ThemeCheckboxGroup";
import { ThemeManagerProviderHOC } from "~/components/ThemeManagerProvider";
import { useThemeManager } from "~/hooks/useThemeManager";
import { useTenantThemes } from "~/hooks/useTenantThemes";
import { AddTheme } from "~/components/AddTheme";
import { ThemeLoader, ThemeSource } from "~/components/ThemeLoader";
import { useCurrentTheme } from "~/hooks/useCurrentTheme";

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
        <Fragment>
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
        </Fragment>
    );
};

const AppReloader = () => {
    const theme = useCurrentTheme();
    const themeRef = useRef(null);

    useEffect(() => {
        if (!theme) {
            return;
        }

        if (themeRef.current && themeRef.current !== theme) {
            // Reload the app to apply the new theme plugins.
            window.location.reload();
            return;
        }

        themeRef.current = theme;
    }, [theme]);

    return null;
};

const AdminThemeLoader = memo(function AdminThemeLoader() {
    const { themes } = useThemeManager();

    return themes.length > 0 ? <ThemeLoader themes={themes} /> : null;
});

AdminThemeLoader.displayName = "AdminThemeLoader";

interface ThemesModuleProps {
    themes?: ThemeSource[];
}

export const ThemesModule = ({ themes = [] }: ThemesModuleProps) => {
    return (
        <Fragment>
            <Provider hoc={ThemeManagerProviderHOC} />
            <Plugins>
                {themes.map(th => (
                    <AddTheme key={th.name} name={th.name} label={th.label} load={th.load} />
                ))}
                <TenantFormFields />
                <WebsiteSettings />
                <AppReloader />
                <AdminThemeLoader />
            </Plugins>
        </Fragment>
    );
};
