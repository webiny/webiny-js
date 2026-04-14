import React, { useMemo } from "react";
import { Select, type SelectProps } from "@webiny/admin-ui";
import type { LanguageDto } from "@webiny/languages/exports/admin/languages.js";

export type LanguageSelectorProps = Omit<SelectProps, "options"> & {
    languages: LanguageDto[];
    currentLanguage?: string;
};

export const LanguageSelector = ({ languages, ...props }: LanguageSelectorProps) => {
    const options = useMemo(() => {
        return languages.map(lang => {
            const current = lang.code === props.currentLanguage;
            const disabled = current;
            const label = [`${lang.name} (${lang.code})`];
            if (current) {
                label.push(`- current page language`);
            }

            return {
                value: lang.code,
                label: label.join(" "),
                disabled
            };
        });
    }, [languages]);

    return <Select {...props} options={options} />;
};
