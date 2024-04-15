import React from "react";
import { ContentEntryFormPreview } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/ContentEntryFormPreview";
import { FieldTracker } from "./FieldTracker";

export const DecorateContentEntryFormPreview = ContentEntryFormPreview.createDecorator(Original => {
    return function ContentEntryFormPreview(props) {
        return (
            <FieldTracker>
                <Original {...props} />
            </FieldTracker>
        );
    };
});
