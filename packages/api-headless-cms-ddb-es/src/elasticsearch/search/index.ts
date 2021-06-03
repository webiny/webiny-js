import timeSearch from "./timeSearch";
import refSearch from "./refSearch";
import { ElasticsearchQueryBuilderValueSearchPlugin } from "../../types";

export default (): ElasticsearchQueryBuilderValueSearchPlugin[] => [timeSearch(), refSearch()];
