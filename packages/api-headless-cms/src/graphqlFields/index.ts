import { createTextField } from "./text";
import { createLongTextField } from "./longText";
import { createRefField } from "./ref";
import { createNumberField } from "./number";
import { createBooleanField } from "./boolean";
import { createDateTimeField } from "./datetime";
import { createRichTextField } from "./richText";
import { createFileField } from "./file";
import { createObjectField } from "./object";
import { createDynamicZoneField } from "~/graphqlFields/dynamicZone";
import { CmsModelFieldToGraphQLPlugin } from "~/types";
import { createJsonField } from "~/graphqlFields/json";

export const createGraphQLFields = (): CmsModelFieldToGraphQLPlugin<any>[] => [
    createTextField(),
    createRefField(),
    createNumberField(),
    createDateTimeField(),
    createBooleanField(),
    createLongTextField(),
    createRichTextField(),
    createJsonField(),
    createFileField(),
    createObjectField(),
    createDynamicZoneField()
];
