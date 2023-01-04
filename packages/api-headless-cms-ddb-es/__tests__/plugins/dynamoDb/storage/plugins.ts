import { PluginsContainer } from "@webiny/plugins";
import { createDateStorageTransformPlugin } from "~/dynamoDb/storage/date";
import { createLongTextStorageTransformPlugin } from "~/dynamoDb/storage/longText";
import { createRichTextStorageTransformPlugin } from "~/dynamoDb/storage/richText";
import { createDefaultStorageTransform } from "@webiny/api-headless-cms/storage/default";
import { createObjectStorageTransform } from "@webiny/api-headless-cms/storage/object";
import { createDynamicZoneStorageTransform } from "@webiny/api-headless-cms/graphqlFields/dynamicZone/dynamicZoneStorage";

export const createStoragePluginsContainer = () => {
    return new PluginsContainer([
        createDefaultStorageTransform(),
        createObjectStorageTransform(),
        createDateStorageTransformPlugin(),
        createLongTextStorageTransformPlugin(),
        createRichTextStorageTransformPlugin(),
        createDynamicZoneStorageTransform()
    ]);
};
