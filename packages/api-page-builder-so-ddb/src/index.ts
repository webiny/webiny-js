import { CategoryStorageOperationsDdbProviderPlugin } from "~/operations/category";
import { MenuStorageOperationsDdbProviderPlugin } from "~/operations/menu";
import { PageElementStorageOperationsDdbProviderPlugin } from "~/operations/pageElement";
import { PageStorageOperationsDdbProviderPlugin } from "~/operations/pages";
import { SystemStorageOperationsDdbProviderPlugin } from "~/operations/system";
import { SettingsStorageOperationsDdbProviderPlugin } from "~/operations/settings";

export default () => [
    new CategoryStorageOperationsDdbProviderPlugin(),
    new MenuStorageOperationsDdbProviderPlugin(),
    new PageElementStorageOperationsDdbProviderPlugin(),
    new PageStorageOperationsDdbProviderPlugin(),
    new SystemStorageOperationsDdbProviderPlugin(),
    new SettingsStorageOperationsDdbProviderPlugin()
];
