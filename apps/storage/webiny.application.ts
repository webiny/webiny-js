import { createStorageApp } from "@webiny/pulumi-app-aws";

export default createStorageApp({
    elasticSearch: false
});
