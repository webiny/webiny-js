import React, { useEffect } from "react";
import { ElementRendererInputs } from "@webiny/app-page-builder-elements/contexts/ElementRendererInputs";
import { useTranslations } from "~/translations/TranslationContext";
import { usePage } from "~/pageEditor";

export const CollectElementValues = ElementRendererInputs.createDecorator(Original => {
    return function CollectElementValues(props) {
        const translations = useTranslations();
        const [page] = usePage();
        const { element, inputs, values } = props;

        useEffect(() => {
            if (!inputs || !translations) {
                return;
            }

            Object.entries(props.values).forEach(([key, value]) => {
                if (!value || !inputs[key].isTranslatable()) {
                    return;
                }

                translations.setTranslationItem({
                    collectionId: `page:${page.id}`,
                    value: value,
                    itemId: `element:${element.id}.${key}`,
                    context: {
                        element: {
                            id: element.id,
                            type: element.type
                        },
                        input: {
                            name: key
                        }
                    }
                });
            });
        }, [element.id, values]);

        return <Original {...props} />;
    };
});
