import { ElasticsearchQueryBuilderValueSearchPlugin } from "@webiny/api-headless-cms/types";
import timeSearch from "./timeSearch";

export default (): ElasticsearchQueryBuilderValueSearchPlugin[] => [timeSearch()];
