import React from "react";
import { FieldElement } from "@webiny/app-headless-cms-common";
import { useFoldersType } from "@webiny/app-aco";

export type FieldProps = React.ComponentProps<typeof FieldElement>;

export type FolderFieldDecoratorProps = {
    id?: string;
};

export const shouldDecorateFolderField = (
    decoratorProps: FolderFieldDecoratorProps,
    componentProps: FieldProps
) => {
    const { id } = decoratorProps;
    const type = useFoldersType();

    if (type !== "FmFile") {
        return false;
    }

    if (id) {
        return id === "*" ? true : id === componentProps.field.id;
    }

    return true;
};
