import timeSearch from "./timeSearch";
import { ElasticsearchQueryBuilderValueSearchPlugin } from "../../types";

export default (): ElasticsearchQueryBuilderValueSearchPlugin[] => [timeSearch()];
