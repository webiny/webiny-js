import richTextStorage from "./storage/richText";
import longTextStorage from "./storage/longText";
import { createDateStorageTransformPlugin } from "./storage/date";

export default () => [richTextStorage(), longTextStorage(), createDateStorageTransformPlugin()];
