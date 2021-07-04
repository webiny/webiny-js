import { LocalesStorageOperationsProviderDdbPlugin } from "./operations/locales";
import { SystemStorageOperationsProviderDdbPlugin } from "./operations/system";
import filters from "@webiny/db-dynamodb/plugins/filters";

export default () => [
    new LocalesStorageOperationsProviderDdbPlugin(),
    new SystemStorageOperationsProviderDdbPlugin(),
    filters()
];
