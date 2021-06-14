import { DataSourcePlugin } from "@webiny/api-dynamic-pages/plugins/DataSourcePlugin";
import { GetEntryDataSource } from "./GetEntryDataSource";

export default () => [
    new DataSourcePlugin({
        type: "cms-get-entry",
        factory: () => new GetEntryDataSource()
    })
];
