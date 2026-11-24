import { customAlphabet } from "nanoid";
import { lowercase, numbers } from "nanoid-dictionary";
import type { TextInput } from "./types.js";

/**
 * The hidden field that gives every item of an object list input (`createObjectInput({ list: true })`)
 * a stable id, as Headless CMS's object lists do (`_id`, `ObjectFieldMapper`). An item keeps its id
 * when the list is reordered or another item is removed, so anything keyed by the item (translations,
 * React keys) follows it; binding paths stay index-based (`items/0/label`, `items/0/_id`).
 */
export const LIST_ITEM_ID = "_id";

/** A new item id: 12 lowercase letters and digits, as Headless CMS's `generateAlphaNumericLowerCaseId(12)`. */
export const generateListItemId = customAlphabet(`${lowercase}${numbers}`, 12);

/**
 * The `_id` field the input AST adds to every object list item (`ComponentManifestToAstConverter`).
 * It isn't shown in the sidebar.
 */
export const createListItemIdInput = (): TextInput => ({
    type: "text",
    name: LIST_ITEM_ID,
    label: "Item ID",
    hideFromUi: true
});

/** Whether a stored item id is usable: a non-empty string. */
export const isListItemId = (value: unknown): value is string => {
    return typeof value === "string" && value.length > 0;
};
