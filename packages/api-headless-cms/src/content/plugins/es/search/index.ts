import { ElasticsearchQueryBuilderValueSearchPlugin } from "../../../../types";
import timeSearch from "./timeSearch";
import refSearch from "./refSearch";

export default (): ElasticsearchQueryBuilderValueSearchPlugin[] => [timeSearch(), refSearch()];
