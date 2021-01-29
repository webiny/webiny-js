import React from "react";
import DateTimeWithoutTimezone from "../../fieldRenderers/dateTime/DateTimeWithoutTimezone";
import DateTimeWithTimezone from "../../fieldRenderers/dateTime/DateTimeWithTimezone";
import Time from "../../fieldRenderers/dateTime/Time";
import Input from "../../fieldRenderers/dateTime/Input";
import { CmsEditorField } from "@webiny/app-headless-cms/types";

export const createInputField = (field: CmsEditorField, bind: any) => {
    if (field.settings.type === "dateTimeWithoutTimezone") {
        return <DateTimeWithoutTimezone field={field} bind={bind} />;
    }
    if (field.settings.type === "dateTimeWithTimezone") {
        return <DateTimeWithTimezone field={field} bind={bind} />;
    }
    if (field.settings.type === "time") {
        return <Time field={field} bind={bind} />;
    }
    return <Input bind={bind} field={field} type={field.settings.type} />;
};
