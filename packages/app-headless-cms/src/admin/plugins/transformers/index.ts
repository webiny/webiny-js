import { createDateTransformer } from "./dateTransformer";
import { createNumberTransformer } from "./numberTransformer";
import { createDynamicZoneTransformer } from "./dynamicZoneTransformer";
import { CmsFieldValueTransformer } from "@webiny/app-headless-cms-common/types";

export default (): CmsFieldValueTransformer[] => [
    createDateTransformer(),
    createNumberTransformer(),
    createDynamicZoneTransformer()
];
