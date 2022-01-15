import React from "react";
import { DateTimeWithoutTimezone } from "../../fieldRenderers/dateTime/DateTimeWithoutTimezone";
import { DateTimeWithTimezone } from "../../fieldRenderers/dateTime/DateTimeWithTimezone";
import { Time } from "../../fieldRenderers/dateTime/Time";
import { CmsEditorField } from "~/types";
import { DateOnly } from "~/admin/plugins/fieldRenderers/dateTime/DateOnly";

export const createInputField = (field: CmsEditorField, bind: any) => {
    if (field.settings.type === "dateTimeWithoutTimezone") {
        return <DateTimeWithoutTimezone field={field} bind={bind} />;
    } else if (field.settings.type === "dateTimeWithTimezone") {
        return <DateTimeWithTimezone field={field} bind={bind} />;
    } else if (field.settings.type === "time") {
        return <Time field={field} bind={bind} />;
    }
    return <DateOnly bind={bind} field={field} />;
};
