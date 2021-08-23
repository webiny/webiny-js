import {
    Params,
    PageStorageOperationsProviderPlugin
} from "@webiny/api-page-builder/plugins/PageStorageOperationsProviderPlugin";
import { PageStorageOperations } from "@webiny/api-page-builder/types";
import { PageStorageOperationsDdbEs } from "./PageStorageOperations";
import { installation } from "~/operations/system/InstallationDdbEsPlugin";
import fields from "./fields";

export class PageStorageOperationsDdbEsProviderPlugin extends PageStorageOperationsProviderPlugin {
    public async provide({ context }: Params): Promise<PageStorageOperations> {
        /**
         * We need the installation plugin to insert the page builder elasticsearch index on before install.
         */
        context.plugins.register([installation(), fields()]);

        return new PageStorageOperationsDdbEs({
            context
        });
    }
}
