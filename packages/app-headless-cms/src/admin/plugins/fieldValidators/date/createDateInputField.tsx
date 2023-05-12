import React from "react";
import { DateTimeWithoutTimezone } from "../../fieldRenderers/dateTime/DateTimeWithoutTimezone";
import { DateTimeWithTimezone } from "../../fieldRenderers/dateTime/DateTimeWithTimezone";
import { Time } from "../../fieldRenderers/dateTime/Time";
import { CmsModelField } from "~/types";
import { DateOnly } from "~/admin/plugins/fieldRenderers/dateTime/DateOnly";
import { BindComponentRenderProp } from "@webiny/form";

export const createInputField = (field: CmsModelField, bind: BindComponentRenderProp) => {
    const type = field.settings ? field.settings.type : null;
    if (type === "dateTimeWithoutTimezone") {
        return <DateTimeWithoutTimezone field={field} bind={bind} />;
    } else if (type === "dateTimeWithTimezone") {
        return <DateTimeWithTimezone field={field} bind={bind} />;
    } else if (type === "time") {
        return <Time field={field} bind={bind} />;
    }
    return <DateOnly bind={bind} field={field} />;
};
