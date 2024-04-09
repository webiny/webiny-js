import React, { Fragment, memo, useEffect, useRef } from "react";
import gql from "graphql-tag";
import { Provider, Plugins } from "@webiny/app-admin";
import { AddPbWebsiteSettings } from "@webiny/app-page-builder";
import { AddTenantFormField, IsRootTenant, IsNotRootTenant } from "@webiny/app-tenant-manager";
import { useBind } from "@webiny/form";
import { AutoComplete } from "@webiny/ui/AutoComplete";
import { validation } from "@webiny/validation";
import { ThemeCheckboxGroup } from "~/components/ThemeCheckboxGroup";
import { ThemeManagerProviderHOC } from "~/components/ThemeManagerProvider";
import { useThemeManager } from "~/hooks/useThemeManager";
import { useTenantThemes } from "~/hooks/useTenantThemes";
import { AddTheme } from "~/components/AddTheme";
import { ThemeLoader } from "~/components/ThemeLoader";
import { useCurrentTheme } from "~/hooks/useCurrentTheme";
import { ThemeSource } from "~/types";

const { Group, Element } = AddPbWebsiteSettings;

const tenantFormFieldsSelection = gql`
    {
        settings {
            themes
        }
    }
`;
const TenantFormFields = memo(function TenantFormFields() {
    return (
        <AddTenantFormField
            querySelection={tenantFormFieldsSelection}
            element={<ThemeCheckboxGroup />}
        />
    );
});

const AllThemes = () => {
    const { themes } = useThemeManager();

    return <ThemeSelect themes={themes} />;
};

const TenantThemes = () => {
    const themes = useTenantThemes();

    return <ThemeSelect themes={themes} />;
};

interface ThemeSelectProps {
    themes: ThemeSource[];
}

const ThemeSelect: React.ComponentType<ThemeSelectProps> = ({ themes }) => {
    const bind = useBind({
        name: "theme",
        validators: validation.create("required")
    });

    const options = themes.map(theme => ({ id: theme.name, name: theme.label || theme.name }));
    const value = options.find(option => option.id === bind.value) || { id: "", name: "" };

    return (
        <AutoComplete
            {...bind}
            label="Theme"
            description={"Select a theme to use for your website."}
            options={options}
            value={value}
        />
    );
};

const WebsiteSettingsSelection = gql`
    {
        theme
    }
`;

const WebsiteSettings = () => {
    return (
        <Fragment>
            <Group name={"theme"} label={"Theme"} querySelection={WebsiteSettingsSelection}>
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
    const themeRef = useRef<string | null>(null);

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

export const ThemesModule: React.ComponentType<ThemesModuleProps> = ({ themes = [] }) => {
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
