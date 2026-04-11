import React from "react";
import { UnsetOnUnmount } from "@webiny/form";
import { useLanguages } from "@webiny/languages/exports/admin/languages.js";
import { useWcp } from "@webiny/app-admin";
import { Grid } from "@webiny/admin-ui";
import { Bind, useForm } from "@webiny/form";
import { LanguageSelector } from "~/presentation/components/LanguageSelector.js";

export const Language = () => {
    const { languages } = useLanguages();
    const wcp = useWcp();
    const form = useForm();

    if (!wcp.canUseFeature("multiTenancy") || languages.length === 0) {
        return null;
    }

    const knownCodes = languages.map(l => l.code);

    const updatePath = (value: string | null) => {
        if (languages.length <= 1) {
            return;
        }

        const currentPath: string = form.getValue("properties.path") ?? "";
        const match = currentPath.match(/^\/([^/]+)(\/.*)?$/);
        const stripped = match && knownCodes.includes(match[1]) ? (match[2] ?? "") : currentPath;

        if (value) {
            form.setValue("properties.path", `/${value}${stripped}`);
        } else {
            form.setValue("properties.path", stripped);
        }
    };

    if (languages.length > 1) {
        const defaultLanguage = languages.find(l => l.isDefault);

        return (
            <Grid.Column span={12}>
                <UnsetOnUnmount name={"properties.language"}>
                    <Bind
                        name={"properties.language"}
                        defaultValue={defaultLanguage?.code}
                        afterChange={updatePath}
                    >
                        {({ value, onChange }) => (
                            <LanguageSelector
                                value={value}
                                onChange={onChange}
                                label={"Language"}
                                languages={languages}
                                displayResetAction={true}
                            />
                        )}
                    </Bind>
                </UnsetOnUnmount>
            </Grid.Column>
        );
    }

    if (languages.length === 1) {
        return <Bind name={"properties.language"} defaultValue={languages[0].code} />;
    }

    return null;
};
