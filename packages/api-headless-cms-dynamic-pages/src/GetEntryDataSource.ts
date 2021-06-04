import fetch from "node-fetch";
import { DataSource } from "@webiny/api-dynamic-pages/plugins/DataSourcePlugin";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { interpolateVariables } from "./interpolateVariables";

interface Config {
    url: string;
    query: string;
    variables: Record<string, any>;
}

export class GetEntryDataSource extends DataSource<Config, CmsContext> {
    async loadData(variables, config: Config, context: CmsContext) {
        const apiKey = await context.cms.system.getReadAPIKey();

        const res = await fetch(config.url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: apiKey },
            body: JSON.stringify({
                query: config.query,
                variables: interpolateVariables(config.variables, variables)
            })
        }).then(res => res.json());

        return res;
    }
}
