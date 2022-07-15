import { createTextField } from "./text";
import { createLongTextField } from "./longText";
import { createRefField } from "./ref";
import { createNumberField } from "./number";
import { createBooleanField } from "./boolean";
import { createDateTimeField } from "./datetime";
import { createRichTextField } from "./richText";
import { createFileField } from "./file";
import { createObjectField } from "./object";
import { CmsModelFieldToGraphQLPlugin } from "~/types";

export const createGraphQLFields = (): CmsModelFieldToGraphQLPlugin[] => [
    createTextField(),
    createRefField(),
    createNumberField(),
    createDateTimeField(),
    createBooleanField(),
    createLongTextField(),
    createRichTextField(),
    createFileField(),
    createObjectField()
];
