import dateTransformer from "./dateTransformer";
import numberTransformer from "./numberTransformer";
import { CmsFieldValueTransformer } from "~/types";

export default (): CmsFieldValueTransformer[] => [dateTransformer(), numberTransformer()];
