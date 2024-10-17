import React from "react";
import { AddTranslatableItemsContext } from "./AddTranslatableItemsContext";
import { SaveTranslatableValues } from "~/translations/ExtractTranslatableValues/SaveTranslatableValues";
import { PageEditorConfig } from "~/pageEditor";
import {
    createElementRendererInputsDecorator,
    CreateTranslatableItem
} from "~/translations/ExtractTranslatableValues/CollectElementValues";

interface ExtractTranslatableValuesProps {
    createTranslatableItem: CreateTranslatableItem;
}

export const ExtractTranslatableValues = ({
    createTranslatableItem
}: ExtractTranslatableValuesProps) => {
    const CollectElementValues = createElementRendererInputsDecorator(createTranslatableItem);

    return (
        <>
            <AddTranslatableItemsContext />
            <PageEditorConfig>
                <CollectElementValues />
                <SaveTranslatableValues />
            </PageEditorConfig>
        </>
    );
};
