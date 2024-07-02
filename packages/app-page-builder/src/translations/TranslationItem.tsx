import { useEffect } from "react";
import { useTranslations } from "./TranslationContext";

export interface TranslationItemProps {
    collection: string;
    itemId: string;
    source: any;
    context?: Record<string, any>;
}

export const TranslationItem = (props: TranslationItemProps) => {
    const translations = useTranslations();

    useEffect(() => {
        if (!translations) {
            return;
        }

        translations.setTranslationItem(props);
    }, [props.source]);

    return null;
};
