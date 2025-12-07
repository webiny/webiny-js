import React from "react";
import { CompositionScope } from "@webiny/app-admin";
import { ModelProvider, Fields } from "@webiny/app-headless-cms-common";
import { Bind, BindPrefix } from "@webiny/form";
import { useFolderExtensionsFields } from "~/features/folders/getFolderExtensionsFields/index.js";
import { useFolderModel } from "~/hooks/useFolderModel.js";

export const Extensions = () => {
    const { fields } = useFolderExtensionsFields();
    const folderModel = useFolderModel();

    if (fields.length === 0 || !folderModel) {
        return null;
    }

    return (
        <CompositionScope name={"aco.folderDetails.extensionFields"}>
            <ModelProvider model={folderModel}>
                <BindPrefix name={"extensions"}>
                    <div className={"mt-lg"}>
                        <Fields
                            contentModel={folderModel}
                            // @ts-expect-error
                            Bind={Bind}
                            fields={fields}
                            layout={fields.map(field => [field.fieldId])}
                        />
                    </div>
                </BindPrefix>
            </ModelProvider>
        </CompositionScope>
    );
};
