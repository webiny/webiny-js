import { useEffect } from "react";
import { TranslatableItem, useTranslations } from "./TranslationContext";

export const TranslationItem = (props: TranslatableItem) => {
    const translations = useTranslations();

    useEffect(() => {
        if (!translations) {
            return;
        }

        translations.setTranslationItem(props);
    }, [props.value]);

    return null;
};
