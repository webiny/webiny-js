import React from "react";
import { type LanguageDto } from "@webiny/languages/exports/admin/languages.js";
import { useWcp } from "@webiny/app-admin";
import { Grid } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";
import { LanguageSelector } from "~/presentation/components/LanguageSelector.js";

export interface WithLanguageSelectorProps {
    languages: LanguageDto[];
    children: React.ReactNode;
}

// 1) no language exists
//    - no dropdown
//    - don’t store language info
// 2) one language exists
//    - no dropdown
//    - auto-assign the default language
//    - DO NOT prepend the language code to the page path
// 3) two or more languages exist
//    - dropdown
//    - preselect default language
//    - append the language code to the page path

export const WithLanguageSelector = ({ languages, children }: WithLanguageSelectorProps) => {
    const wcp = useWcp();

    if (!wcp.canUseFeature("multiTenancy")) {
        return <>{children}</>;
    }

    if (languages.length > 1) {
        const defaultLanguage = languages.find(l => l.isDefault);

        return (
            <>
                <Grid.Column span={12}>
                    <Bind name={"properties.language"} defaultValue={defaultLanguage?.code}>
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
                </Grid.Column>
                {children}
            </>
        );
    }

    if (languages.length === 1) {
        return <Bind name={"properties.language"} defaultValue={languages[0].code} />;
    }

    /* Default output */
    return <>{children}</>;
};
