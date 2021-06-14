import { DataSource } from "@webiny/api-dynamic-pages/plugins/DataSourcePlugin";
import { CmsContext } from "@webiny/api-headless-cms/types";

interface Config {
    query: string;
    [key: string]: any;
}

export class GetEntriesDataSource extends DataSource<Config, CmsContext> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async loadData(variables, config: Config, context: CmsContext) {
        return [];
    }
}
