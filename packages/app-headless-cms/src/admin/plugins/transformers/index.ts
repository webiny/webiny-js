import { createDateTransformer } from "./dateTransformer";
import { createNumberTransformer } from "./numberTransformer";
import { createDynamicZoneTransformer } from "./dynamicZoneTransformer";
import { createObjectTransformer } from "./objectTransformer";
import { CmsFieldValueTransformer } from "~/types";

export default (): CmsFieldValueTransformer[] => [
    createDateTransformer(),
    createNumberTransformer(),
    createDynamicZoneTransformer(),
    createObjectTransformer()
];
