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
    OnAfterBlockCreateTopicParams,
    OnBeforeBlockCreateTopicParams,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    Block,
    BlocksCrud,
    PbContext
} from "~/types";
import checkBasePermissions from "./utils/checkBasePermissions";
//import checkOwnPermissions from "./utils/checkOwnPermissions";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";

const CreateDataModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    type: string({ validation: validation.create("required,in:element:block") }),
    blockCategory: string({ validation: validation.create("required,slug") }),
    content: object({ validation: validation.create("required") }),
    preview: object({ validation: validation.create("required") })
})();

const PERMISSION_NAME = "pb.block";

export interface CreateBlocksCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
}
export const createBlocksCrud = (params: CreateBlocksCrudParams): BlocksCrud => {
    const { context, storageOperations, getLocaleCode, getTenantId } = params;

    const onBeforeBlockCreate = createTopic<OnBeforeBlockCreateTopicParams>();
    const onAfterBlockCreate = createTopic<OnAfterBlockCreateTopicParams>();

    return {
        /**
         * Lifecycle events
         */
        onBeforeBlockCreate,
        onAfterBlockCreate,

        async createBlock(this: PageBuilderContextObject, input) {
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

            const createDataModel = new CreateDataModel().populate(input);
            await createDataModel.validate();

            const blockCategory = await this.getBlockCategory(input.blockCategory);
            if (!blockCategory) {
                throw new NotFoundError(
                    `Cannot create block because failed to find such block category.`
                );
            }

            const id: string = mdbid();
            const identity = context.security.getIdentity();

            const data: Block = await createDataModel.toJSON();

            const block: Block = {
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
                await onBeforeBlockCreate.publish({
                    block
                });
                const result = await storageOperations.blocks.create({
                    input: data,
                    block
                });
                await onAfterBlockCreate.publish({
                    block
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create block.",
                    ex.code || "CREATE_BLOCK_ERROR",
                    {
                        ...(ex.data || {}),
                        block
                    }
                );
            }
        }
    };
};
