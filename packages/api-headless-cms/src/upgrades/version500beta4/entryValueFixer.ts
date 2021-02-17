import {
    CmsContentEntry,
    CmsContentIndexEntry,
    CmsContentModel
} from "@webiny/api-headless-cms/types";
import { ModelFieldFinder } from "./fieldFinder";
import { cleanDatabaseRecord } from "./cleanDatabaseRecord";
import { TimeScalar } from "@webiny/handler-graphql/builtInTypes";
import WebinyError from "@webiny/error";

const fixRawValues = (
    target: CmsContentIndexEntry,
    finder: ModelFieldFinder
): CmsContentIndexEntry => {
    const entry = {
        ...target
    };
    for (const fieldId in entry.rawValues) {
        // if field is ref field then continue, otherwise break
        const field = finder.findById(target.modelId, fieldId);
        if (field.type !== "ref") {
            continue;
        }
        const existingValue = entry.values[fieldId];
        const rawValue = entry.rawValues[fieldId];
        // always remove from rawValue
        delete entry.rawValues[fieldId];
        // if there is something in values - do not switch it
        if (!!existingValue || rawValue === undefined || rawValue === null) {
            continue;
        }
        entry.values = rawValue;
    }
    return entry;
};

const fixTime = (time: any): number | null => {
    if (isNaN(time as number) === false) {
        return parseInt(time);
    }
    // lets not reinvent the wheel
    return TimeScalar.parseValue(time);
};

const fixDate = (date: any): string => {
    try {
        return new Date(date).toISOString();
    } catch (ex) {
        throw new WebinyError(
            "Could not convert what is assumed to be a date string to a date object.",
            "DATE_CONVERT_ERROR",
            {
                date
            }
        );
    }
};

const fixDateTime = (dateTime: any): string => {
    try {
        return new Date(dateTime).toISOString();
    } catch (ex) {
        throw new WebinyError(
            "Could not convert what is presumed to be a dateTime string to a date object.",
            "DATETIME_CONVERT_ERROR",
            {
                dateTime
            }
        );
    }
};

const dateFixMethods = {
    time: fixTime,
    date: fixDate,
    dateTime: fixDateTime
};

const fixDateTimeValues = (
    target: CmsContentIndexEntry,
    finder: ModelFieldFinder
): CmsContentIndexEntry => {
    const entry = {
        ...target
    };
    for (const fieldId in target.values) {
        const field = finder.findById(target.modelId, fieldId);
        const fixMethod = dateFixMethods[field.type];
        if (!fixMethod) {
            continue;
        } else if (target.values[fieldId] === null || target.values[fieldId] === undefined) {
            continue;
        }
        target.values[fieldId] = fixMethod(target.values[fieldId]);
    }

    return entry;
};

export const entryValueFixer = (
    model: CmsContentModel,
    finder: ModelFieldFinder,
    target: CmsContentIndexEntry
): CmsContentEntry => {
    return cleanDatabaseRecord(fixDateTimeValues(fixRawValues(target, finder), finder));
};
