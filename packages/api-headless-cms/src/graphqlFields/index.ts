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
import { PluginCollection } from "@webiny/plugins/types";

export const createGraphQLFields = (): PluginCollection => [
    createTextField(),
    createRefField(),
    createNumberField(),
    createDateTimeField(),
    createBooleanField(),
    createLongTextField(),
    createRichTextField(),
    createFileField(),
    createObjectField(),
    createDynamicZoneField()
];
