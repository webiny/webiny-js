import dateTransformer from "./dateTransformer";
import numberTransformer from "./numberTransformer";
import { CmsFieldValueTransformer } from "@webiny/app-headless-cms/types";

export default (): CmsFieldValueTransformer[] => [dateTransformer(), numberTransformer()];
