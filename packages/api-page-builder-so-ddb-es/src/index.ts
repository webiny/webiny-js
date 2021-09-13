import { CategoryStorageOperationsDdbEsProviderPlugin } from "~/operations/category";
import { MenuStorageOperationsDdbEsProviderPlugin } from "~/operations/menu";
import { PageElementStorageOperationsDdbEsProviderPlugin } from "~/operations/pageElement";
import { PageStorageOperationsDdbEsProviderPlugin } from "~/operations/pages";
import { SystemStorageOperationsDdbEsProviderPlugin } from "~/operations/system";
import { SettingsStorageOperationsDdbEsProviderPlugin } from "~/operations/settings";
import upgrades from "./upgrades";

export default () => [
    new CategoryStorageOperationsDdbEsProviderPlugin(),
    new MenuStorageOperationsDdbEsProviderPlugin(),
    new PageElementStorageOperationsDdbEsProviderPlugin(),
    new PageStorageOperationsDdbEsProviderPlugin(),
    new SystemStorageOperationsDdbEsProviderPlugin(),
    new SettingsStorageOperationsDdbEsProviderPlugin(),
    upgrades()
];
