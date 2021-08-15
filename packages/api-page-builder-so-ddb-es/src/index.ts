import { CategoryStorageOperationsDdbEsProviderPlugin } from "~/operations/category";
import { MenuStorageOperationsDdbEsProviderPlugin } from "~/operations/menu";

export default () => [
    new CategoryStorageOperationsDdbEsProviderPlugin(),
    new MenuStorageOperationsDdbEsProviderPlugin()
];
