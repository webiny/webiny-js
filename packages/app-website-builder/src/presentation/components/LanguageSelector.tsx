import React, { useMemo } from "react";
import { Select, type SelectProps } from "@webiny/admin-ui";
import type { LanguageDto } from "@webiny/languages/exports/admin/languages.js";

export type LanguageSelectorProps = Omit<SelectProps, "options"> & {
    languages: LanguageDto[];
};

export const LanguageSelector = ({ languages, ...props }: LanguageSelectorProps) => {
    const options = useMemo(() => {
        return languages.map(lang => ({
            value: lang.code,
            label: `${lang.name} (${lang.code})`
        }));
    }, [languages]);

    return <Select {...props} options={options} />;
};
