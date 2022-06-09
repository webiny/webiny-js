/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { withFields, string } from "@commodo/fields";
/**
 * Package commodo-fields-object does not have types.
 */
// @ts-ignore
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import {
    OnAfterPageBlockCreateTopicParams,
    OnBeforePageBlockCreateTopicParams,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    PageBlock,
    PageBlocksCrud,
    PbContext
} from "~/types";
import checkBasePermissions from "./utils/checkBasePermissions";
//import checkOwnPermissions from "./utils/checkOwnPermissions";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";

const CreateDataModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    blockCategory: string({ validation: validation.create("required,slug") }),
    content: object({ validation: validation.create("required") }),
    preview: object({ validation: validation.create("required") })
})();

const PERMISSION_NAME = "pb.block";

export interface CreatePageBlocksCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
}
export const createPageBlocksCrud = (params: CreatePageBlocksCrudParams): PageBlocksCrud => {
    const { context, storageOperations, getLocaleCode, getTenantId } = params;

    const onBeforePageBlockCreate = createTopic<OnBeforePageBlockCreateTopicParams>();
    const onAfterPageBlockCreate = createTopic<OnAfterPageBlockCreateTopicParams>();

    return {
        /**
         * Lifecycle events
         */
        onBeforePageBlockCreate,
        onAfterPageBlockCreate,

        async createPageBlock(this: PageBuilderContextObject, input) {
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

            const createDataModel = new CreateDataModel().populate(input);
            await createDataModel.validate();

            const blockCategory = await this.getBlockCategory(input.blockCategory);
            if (!blockCategory) {
                throw new NotFoundError(
                    `Cannot create page block because failed to find such block category.`
                );
            }

            const id: string = mdbid();
            const identity = context.security.getIdentity();

            const data: PageBlock = await createDataModel.toJSON();

            const pageBlock: PageBlock = {
                ...data,
                tenant: getTenantId(),
                locale: getLocaleCode(),
                id,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    type: identity.type,
                    displayName: identity.displayName
                }
            };

            try {
                await onBeforePageBlockCreate.publish({
                    pageBlock
                });
                const result = await storageOperations.pageBlocks.create({
                    input: data,
                    pageBlock
                });
                await onAfterPageBlockCreate.publish({
                    pageBlock
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create page block.",
                    ex.code || "CREATE_PAGE_BLOCK_ERROR",
                    {
                        ...(ex.data || {}),
                        pageBlock
                    }
                );
            }
        }
    };
};
