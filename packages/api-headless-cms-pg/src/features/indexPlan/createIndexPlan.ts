import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";
import { createFields } from "@webiny/api-headless-cms-storage";
import type {
    Field,
    FieldFilterPathRegistry,
    FieldFilterValueTransformRegistry
} from "@webiny/api-headless-cms-storage";
import type { IndexFamily, SlotFamily } from "~/features/schema/slots.js";

export interface IIndexPath {
    /* Value path inside the stored entry, e.g. "values.author.name" or "location.folderId". */
    path: string;
    /*
     * The same path built from storage ids ("values.object@a1.text@b2"): the field's identity in the
     * scope's slot map. A field renamed in the admin UI keeps it; one deleted and added again under
     * the same name gets a new one. System fields have storageId = fieldId, so theirs is the path.
     */
    key: string;
    family: IndexFamily;
    system: boolean;
    field: Field;
    /*
     * Quoted phrases are matched as phrases (word pairs and positions in `tsv`). Opt-in per field
     * (`settings.search.phrases`); on by default only for the model's title field.
     */
    phrases?: boolean;
    /*
     * Text inside words is indexed (suffix lexemes), so `contains` and the search box match anywhere
     * in a word. Opt-in per text field (`settings.search.substrings`): it adds about 40% of a row's
     * index keys. Without it, they match whole words and word starts.
     */
    substrings?: boolean;
}

export interface IIndexPlan {
    fields: Record<string, Field>;
    paths: Record<string, IIndexPath>;
    /* Paths of filterable fields whose type the search table cannot represent. */
    unsupported: Record<string, string>;
}

const SCALAR_FAMILY_BY_TYPE: Record<string, "t" | "n" | "b"> = {
    text: "t",
    "long-text": "t",
    plainObject: "t",
    ref: "t",
    number: "n",
    datetime: "n",
    boolean: "b"
};

/* Containers (their children are planned separately) and types that are never filterable. */
const SKIPPED_TYPES = new Set(["object", "dynamicZone", "rich-text", "file", "json"]);

const toFamily = (scalar: "t" | "n" | "b", multi: boolean): SlotFamily => {
    if (!multi) {
        return scalar;
    }
    // Multi-value booleans are stored as text tokens ("true" / "false").
    return scalar === "n" ? "na" : "ta";
};

interface ICreateIndexPlanParams {
    model: CmsModel;
    /** Fields registered as `CmsEntrySystemField`, filterable under `system`. */
    systemFields?: CmsModel["fields"];
    pathRegistry: FieldFilterPathRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
}

/* Field-id chain ("values.settings.name") -> storage-id chain ("values.object@a1.text@b2"). */
const storageChains = (
    fields: CmsModel["fields"],
    prefix: string,
    storagePrefix: string,
    out: Map<string, string>
): Map<string, string> => {
    for (const field of fields) {
        const chain = `${prefix}.${field.fieldId}`;
        const storageChain = `${storagePrefix}.${field.storageId}`;
        out.set(chain, storageChain);
        const children = field.settings?.fields;
        if (children?.length) {
            storageChains(children, chain, storageChain, out);
        }
    }
    return out;
};

const hasPhrases = (field: Field, model: CmsModel): boolean => {
    if (field.settings?.search?.phrases !== undefined) {
        return field.settings.search.phrases === true;
    }
    // A model's own top-level fields sit under the "values" parent.
    const isTopLevel = field.parents.length === 1 && field.parents[0].fieldId === "values";
    return !field.system && isTopLevel && field.fieldId === model.titleFieldId;
};

/**
 * Lists every filterable value path of a model (system fields included) with the slot family that
 * can hold it. The paths are the same ones the shared filter parser produces, so a parsed `where`
 * maps onto slots one to one.
 */
export const createIndexPlan = (params: ICreateIndexPlanParams): IIndexPlan => {
    const fields = createFields({
        pathRegistry: params.pathRegistry,
        transformRegistry: params.transformRegistry,
        fields: params.model.fields,
        systemFields: params.systemFields
    });

    const paths: Record<string, IIndexPath> = {};
    const unsupported: Record<string, string> = {};
    const chains = storageChains(params.model.fields, "values", "values", new Map());

    for (const field of Object.values(fields)) {
        const type = getBaseFieldType(field);
        if (SKIPPED_TYPES.has(type)) {
            continue;
        }
        let path: string;
        try {
            path = field.createPath({ field });
        } catch {
            // e.g. a plainObject field without a value path (the "meta" system field): not filterable.
            unsupported[field.fieldId] = type;
            continue;
        }
        const chain = [...field.parents.map(parent => parent.fieldId), field.fieldId].join(".");
        const storageChain = field.system ? undefined : chains.get(chain);
        // Path handlers may extend the chain (a ref's ".entryId"); the extension is kept as it is.
        const toKey = (value: string): string =>
            storageChain && (value === chain || value.startsWith(`${chain}.`))
                ? storageChain + value.slice(chain.length)
                : value;
        const multi = !!field.list || field.parents.some(parent => parent.list);
        if (type === "searchable-json") {
            paths[path] = { path, key: toKey(path), family: "j", system: field.system, field };
            continue;
        }
        const scalar = SCALAR_FAMILY_BY_TYPE[type];
        if (!scalar) {
            unsupported[path] = type;
            continue;
        }
        const family = toFamily(scalar, multi);
        if (type === "ref") {
            for (const property of ["entryId", "id", "modelId"]) {
                const refPath = `${path}.${property}`;
                paths[refPath] = {
                    path: refPath,
                    key: toKey(refPath),
                    family,
                    system: field.system,
                    field
                };
            }
            continue;
        }
        paths[path] = { path, key: toKey(path), family, system: field.system, field };
        if (scalar === "t" && hasPhrases(field, params.model)) {
            paths[path].phrases = true;
        }
        if (scalar === "t" && !field.system && field.settings?.search?.substrings === true) {
            paths[path].substrings = true;
        }
    }

    return { fields, paths, unsupported };
};
