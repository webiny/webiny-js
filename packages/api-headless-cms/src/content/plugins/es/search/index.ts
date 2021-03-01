import { ElasticsearchQueryBuilderValueSearchPlugin } from "../../../../types";
import timeSearch from "./timeSearch";

export default (): ElasticsearchQueryBuilderValueSearchPlugin[] => [timeSearch()];
