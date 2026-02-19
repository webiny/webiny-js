import { createTextField } from "./text.js";
import { createLongTextField } from "./longText.js";
import { createRefField } from "./ref.js";
import { createNumberField } from "./number.js";
import { createBooleanField } from "./boolean.js";
import { createDateTimeField } from "./datetime.js";
import { createRichTextField } from "./richText.js";
import { createFileField } from "./file.js";
import { createObjectField } from "./object.js";
import { createDynamicZoneField } from "./dynamicZone/index.js";
import type { CmsModelFieldToGraphQLPlugin } from "~/types/index.js";
import { createJsonField } from "./json.js";
import { createSearchableJsonField } from "./searchableJson.js";
import { createUiField } from "./ui.js";

export const createGraphQLFields = (): CmsModelFieldToGraphQLPlugin<any>[] => [
    createTextField(),
    createRefField(),
    createNumberField(),
    createDateTimeField(),
    createBooleanField(),
    createLongTextField(),
    createRichTextField(),
    createJsonField(),
    createSearchableJsonField(),
    createFileField(),
    createObjectField(),
    createDynamicZoneField(),
    createUiField()
];
