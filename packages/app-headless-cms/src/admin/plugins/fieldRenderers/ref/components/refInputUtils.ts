import { useCallback } from "react";
import get from "lodash/get";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

export const getValues = (valueObject): string[] => {
    if (!valueObject) {
        return [];
    }

    if (Array.isArray(valueObject.values)) {
        return valueObject.values.map(item => item.value);
    }

    return valueObject.value ? [valueObject.value] : [];
};

export const useI18NHelpers = () => {
    const { getValue, getDefaultLocale } = useI18N();
    // Get title value
    const getTitleValue = useCallback(({ locale, item, useDefaultLocale }) => {
        const defaultLocale = getDefaultLocale();
        const titleInCurrentLocale = getValue(item.meta.title, locale);
        const titleInDefaultLocale = getValue(item.meta.title, defaultLocale.id);

        let name;

        if (titleInCurrentLocale && titleInCurrentLocale.trim().length) {
            name = titleInCurrentLocale;
        }

        if (
            useDefaultLocale &&
            !name &&
            titleInDefaultLocale &&
            titleInDefaultLocale.trim().length
        ) {
            name = titleInDefaultLocale;
        }
        return name;
    }, []);

    // Format options for the Autocomplete component based on`locale`
    const getAutoCompleteOptionsFromList = useCallback(
        ({
            list,
            useDefaultLocale = true,
            locale,
            keyValueExtractor
        }: {
            list: any;
            useDefaultLocale: boolean;
            locale: string;
            keyValueExtractor?: any;
        }) => {
            return get(list, "data.content.data", [])
                .map(item => {
                    const name = getTitleValue({ item, useDefaultLocale, locale });

                    if (!name) {
                        return null;
                    }

                    let keyValue = {};
                    if (keyValueExtractor) {
                        keyValue = keyValueExtractor(item);
                    }

                    return {
                        id: item.id,
                        name: name,
                        aliases: getValues(item.meta.title).filter(
                            // Filter out empty strings
                            alias => alias.trim().length !== 0
                        ),
                        ...keyValue
                    };
                })
                .filter(Boolean);
        },
        []
    );

    return {
        getAutoCompleteOptionsFromList
    };
};
