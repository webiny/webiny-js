import React from "react";
import { ContentEntryForm } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/ContentEntryForm";
import { FieldTracker } from "./FieldTracker";

export const DecorateContentEntryForm = ContentEntryForm.createDecorator(Original => {
    return function ContentEntryForm(props) {
        return (
            <FieldTracker>
                <Original {...props} />
            </FieldTracker>
        );
    };
});
