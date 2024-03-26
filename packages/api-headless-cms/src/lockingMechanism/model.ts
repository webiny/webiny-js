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
                        }
                    ]
                },
                {
                    id: "actions",
                    type: "object",
                    fieldId: "actions",
                    storageId: "object@actions",
                    label: "Actions",
                    multipleValues: true,
                    settings: {
                        fields: [
                            {
                                id: "type",
                                type: "text",
                                fieldId: "type",
                                storageId: "text@type",
                                label: "Action Type",
                                validation: [
                                    {
                                        name: "required",
                                        message: "Action type is required."
                                    }
                                ]
                            },
                            {
                                id: "message",
                                type: "text",
                                fieldId: "message",
                                storageId: "text@message",
                                label: "Message"
                            },
                            {
                                id: "createdBy",
                                type: "object",
                                fieldId: "createdBy",
                                storageId: "object@createdBy",
                                label: "Created By",
                                validation: [
                                    {
                                        name: "required",
                                        message: "Created by is required."
                                    }
                                ],
                                settings: {
                                    fields: [
                                        {
                                            id: "id",
                                            type: "text",
                                            fieldId: "id",
                                            storageId: "text@id",
                                            label: "ID",
                                            validation: [
                                                {
                                                    name: "required",
                                                    message: "ID is required."
                                                }
                                            ]
                                        },
                                        {
                                            id: "displayName",
                                            type: "text",
                                            fieldId: "displayName",
                                            storageId: "text@displayName",
                                            label: "Display Name",
                                            validation: [
                                                {
                                                    name: "required",
                                                    message: "Display name is required."
                                                }
                                            ]
                                        },
                                        {
                                            id: "type",
                                            type: "text",
                                            fieldId: "type",
                                            storageId: "text@type",
                                            label: "Type",
                                            validation: [
                                                {
                                                    name: "required",
                                                    message: "Type is required."
                                                }
                                            ]
                                        }
                                    ]
                                }
                            },
                            {
                                id: "createdOn",
                                type: "datetime",
                                fieldId: "createdOn",
                                storageId: "datetime@createdOn",
                                settings: {
                                    type: "dateTimeWithTimezone"
                                },
                                label: "Created On",
                                validation: [
                                    {
                                        name: "required",
                                        message: "Created on is required."
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        })
    );
};
