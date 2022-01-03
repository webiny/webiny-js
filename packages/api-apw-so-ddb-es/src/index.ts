import { IndexPageDataPlugin } from "@webiny/api-page-builder-so-ddb-es/plugins/definitions/IndexPageDataPlugin";
import { Page } from "@webiny/api-page-builder/types";

export interface PageWithWorkflow extends Page {
    workflow?: string;
}

export default () => [
    /*
     This step is only required if you're using DynamoDB + ElasticSearch setup and you want
     to be able to get the value of the `special` field while listing pages.
     With this plugin, we ensure that the value of the `special` field is also stored in
     ElasticSearch, which is where the data is being retrieved from while listing pages.
    */
    new IndexPageDataPlugin<PageWithWorkflow>(({ data, page }) => {
        // `data` represents the current page's data that will be stored in ElasticSearch.
        // Let's modify it, by adding the value of the new `special` flag to it.
        data.workflow = page.workflow;
    })
];
