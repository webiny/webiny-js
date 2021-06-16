import { Page } from "@webiny/api-page-builder/types";

export interface DynamicPage extends Page {
    dynamic?: boolean;
    settings: Page["settings"] & {
        dataSources?: DataSourceSettings[];
    };
    dataSources?: DataSource[];
}

export interface DataSource {
    id: string;
    type: string;
    data: any;
}

export interface DataSourceSettings {
    id: string;
    // "type" refers to the type of data source (CMS, REST, etc. This comes from the data source plugin).
    type: string;
    // Configuration of the datasource.
    config: Record<string, any>;
}
