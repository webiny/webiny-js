import { createCmsModel, createPrivateModel } from "~/plugins";

export const RECORD_LOCKING_MODEL_ID = "wby_recordLocking";

export const createLockingModel = () => {
    return createCmsModel(
        createPrivateModel({
            modelId: RECORD_LOCKING_MODEL_ID,
            name: "Record Lock Tracking",
            fields: [
                {
                    id: "targetId",
                    type: "text",
                    fieldId: "targetId",
                    storageId: "text@targetId",
                    label: "Target ID",
                    validation: [
                        {
                            name: "required",
                            message: "Target ID is required."
                        }
                    ]
                },
                /**
                 * Since we need a generic way to track records, we will use type to determine if it's a cms record or a page or a form, etc...
                 * Update IHeadlessCmsLockRecordValues in types.ts file with additional fields as required.
                 *
                 * @see IHeadlessCmsLockRecordValues
                 */
                {
                    id: "type",
                    type: "text",
                    fieldId: "type",
                    storageId: "text@type",
                    label: "Record Type",
                    validation: [
                        {
                            name: "required",
                            message: "Record type is required."
                        },
                        /**
                         * Update pattern with additional types as required.
                         * Also update IHeadlessCmsLockRecordEntryType in types.ts file with additional types as required.
                         */
                        {
                            name: "pattern",
                            message: "Record type is required.",
                            settings: {
                                pattern: {
                                    name: "custom",
                                    regex: "^pb:page|cms:([a-zA-Z0-9_-]+)$",
                                    flags: ""
                                }
                            }
                        }
                    ]
                }
            ]
        })
    );
};
