import React from "react";
import { Bind } from "@webiny/form";
import { CmsModel } from "@webiny/app-headless-cms-common/types";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";

interface DefaultLayoutProps {
    model: CmsModel;
}

export const DefaultLayout = ({ model }: DefaultLayoutProps) => {
    return (
        <Fields
            contentModel={model}
            fields={model.fields || []}
            layout={model.layout || []}
            /**
             * TODO @ts-refactor
             * Figure out type for Bind.
             */
            // @ts-expect-error
            Bind={Bind}
        />
    );
};
