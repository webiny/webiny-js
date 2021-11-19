import richTextStorage from "./storage/richText";
import longTextStorage from "./storage/longText";
import dateStorage from "./storage/date";

export default () => [richTextStorage(), longTextStorage(), dateStorage()];
