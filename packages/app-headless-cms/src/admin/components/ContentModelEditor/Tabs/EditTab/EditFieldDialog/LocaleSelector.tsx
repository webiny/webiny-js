import React from "react";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { Select } from "@webiny/ui/Select";

const LocaleSelector = ({ locale, setLocale }) => {
    const i18n = useI18N();

    return (
        <Select
            label={"Locale"}
            value={locale}
            onChange={setLocale}
            description={"Predefined values are set for every available locale separately."}
        >
            {i18n.getLocales().map(locale => (
                <option key={locale.id} value={locale.id}>
                    {locale.code}
                </option>
            ))}
        </Select>
    );
};

export default LocaleSelector;
