import { createStorageApp } from "@webiny/pulumi-aws";

export default createStorageApp({
    elasticSearch: false
});
