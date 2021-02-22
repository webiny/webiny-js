import {
    CmsContentIndexEntry,
    CmsContentModel,
    CmsContentModelDateTimeField,
    CmsContext
} from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

interface Hit {
    _id: string;
    _index: string;
    _source: CmsContentIndexEntry;
}
interface Args {
    context: CmsContext;
    model: CmsContentModel;
    hits: Hit[];
}
const convertTimeToNumber = (time?: string): number => {
    const [hours, minutes, seconds = 0] = time.split(":").map(Number);
    return hours * 60 * 60 + minutes * 60 + seconds;
};

const isTime = (value: string | number) => {
    return String(value).match(/^([0-9]{2}):([0-9]{2})/) !== null;
};

const fixDateTimeWithoutTz = (value: string) => {
    const dateTimeWoTz = String(value).split(" ");
    if (dateTimeWoTz.length < 2) {
        return null;
    } else if (dateTimeWoTz.length > 2) {
        throw new WebinyError(
            "Cannot convert dateTime w/o TZ since there is more than 1 space.",
            "CONVERT_ERROR",
            {
                value
            }
        );
    }
    return new Date(`${dateTimeWoTz.join("T")}.000Z`).toISOString();
};

const fixDate = (value: string): string => {
    const comp = new Date(value).toISOString();
    if (value === comp) {
        return null;
    }
    return comp;
};

const fixValue = (field: CmsContentModelDateTimeField, value: any) => {
    if (!value) {
        return null;
    }
    const { type } = field.settings;
    if (type === "time") {
        if (!isTime(value)) {
            return null;
        }
        return convertTimeToNumber(value);
    } else if (type === "date") {
        return fixDate(value);
    } else if (type === "dateTimeWithoutTimezone") {
        return fixDateTimeWithoutTz(value);
    }
    return null;
};
/**
 * if there is no version - fix is needed since there is no ver in pre beta.5
 */
const isFixNeeded = (item: CmsContentIndexEntry): boolean => {
    const ver = item.webinyVersion;
    if (!ver) {
        return true;
    }
    return false;
};

const fixItem = (item: CmsContentIndexEntry, fields: CmsContentModelDateTimeField[]): boolean => {
    if (!isFixNeeded(item)) {
        return false;
    }
    let fixItem = false;
    for (const field of fields) {
        const value = fixValue(field, item.values[field.fieldId]);
        if (!value) {
            continue;
        }
        item.values[field.fieldId] = value;
        fixItem = true;
    }
    return fixItem;
};

export const fixPreBeta5Entries = async ({
    context,
    model,
    hits
}: Args): Promise<CmsContentIndexEntry[]> => {
    const fields = model.fields.filter(
        f => f.type === "datetime"
    ) as CmsContentModelDateTimeField[];
    if (fields.length === 0) {
        return hits.map(hit => hit._source);
    }
    const { elasticSearch } = context;
    const items: CmsContentIndexEntry[] = [];
    const esOperations = [];
    for (const item of hits) {
        items.push(item._source);
        const fix = fixItem(item._source, fields);
        if (!fix) {
            continue;
        }
        if (!item._id) {
            throw new WebinyError("There is no ES entry id (_id)", "MISSING_ES_ENTRY_ID", {
                item
            });
        }
        esOperations.push(
            {
                index: {
                    _id: item._id,
                    _index: item._index
                }
            },
            {
                ...item._source,
                webinyVersion: context.WEBINY_VERSION
            }
        );
    }
    if (esOperations.length > 0) {
        try {
            await elasticSearch.bulk({ body: esOperations });
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code || "BULK_ES_UPDATE", esOperations);
        }
    }
    return items;
};
