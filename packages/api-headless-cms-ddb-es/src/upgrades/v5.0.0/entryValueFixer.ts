/**
 * File not used anymore.
 */
// @ts-nocheck
import { ModelFieldFinder } from "./fieldFinder";
import { cleanDatabaseRecord } from "./cleanDatabaseRecord";
import { CmsIndexEntry } from "../../types";
import { CmsEntry, CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";

const convertTimeToNumber = (time?: string): number | null => {
    if (!time) {
        return null;
    }
    const [hours, minutes, seconds = 0] = time.split(":").map(Number);
    return hours * 60 * 60 + minutes * 60 + seconds;
};

const fixRawValues = (target: CmsIndexEntry, finder: ModelFieldFinder): CmsIndexEntry => {
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
        if (typeof existingValue !== "undefined" || rawValue === undefined || rawValue === null) {
            continue;
        }
        entry.values[fieldId] = rawValue;
    }
    return entry;
};

const fixTime = (field, time: any): number | null => {
    if (isNaN(time as number) === false) {
        return parseInt(time);
    }
    // lets not reinvent the wheel
    try {
        return convertTimeToNumber(time);
    } catch (err) {
        console.log(`fixTime on field "${field.fieldId}" failed`, err);
        return null;
    }
};

const fixDateTime = (field: CmsModelField, dateTime: any): any => {
    switch (field.settings.type) {
        case "time":
            return fixTime(field, dateTime);
        case "date":
            return new Date(dateTime).toISOString();
        case "dateTimeWithoutTimezone":
            return new Date(dateTime).toISOString();
        default:
            return dateTime;
    }
};

const fixNumber = (_: CmsModelField, value: any) => {
    if (value === undefined || value === null) {
        return null;
    }
    return parseFloat(value);
};

const fieldFixMethods = {
    datetime: fixDateTime,
    number: fixNumber
};

const fixFieldValues = (target: CmsIndexEntry, finder: ModelFieldFinder): CmsIndexEntry => {
    const entry = {
        ...target
    };

    for (const fieldId in target.values) {
        const field = finder.findById(target.modelId, fieldId);
        if (!field) {
            continue;
        }

        const fixMethod = fieldFixMethods[field.type];
        if (!fixMethod) {
            continue;
        } else if (target.values[fieldId] === null || target.values[fieldId] === undefined) {
            continue;
        }
        target.values[fieldId] = fixMethod(field, target.values[fieldId]);
    }

    return entry;
};

export const entryValueFixer = (
    _: CmsModel,
    finder: ModelFieldFinder,
    target: CmsIndexEntry
): CmsEntry => {
    return cleanDatabaseRecord(fixFieldValues(fixRawValues(target, finder), finder));
};
