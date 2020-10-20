import { Batch } from "@commodo/fields-storage";
import { NotFoundResponse, Response, ErrorResponse } from "@webiny/graphql";
import {
    PK_GROUP,
    SK_GROUP
} from "@webiny/api-security-user-management/models/securityGroupData.model";

export default async (_, { id, data }, context) => {
    const Model = context.models.SECURITY;

    const PK = `${PK_GROUP}#${id}`;

    // Get `G#` items from table
    const securityRecord = await Model.findOne({ query: { PK, SK: SK_GROUP } });

    if (securityRecord) {
        try {
            const group = securityRecord.data;
            const propsToUpdate = Object.keys(data);

            for (let i = 0; i < propsToUpdate.length; i++) {
                const key = propsToUpdate[i];
                // Update value
                group[key] = data[key];
            }
            // Add "savedOn"
            group.savedOn = new Date().toISOString();
            // Also update "GSI_DATA" along with "data"
            securityRecord.GSI_DATA = group;

            // Instead of creating new instances of "Security Model" we are reusing
            const securityRecordPrimary = new Model().populate(securityRecord);
            securityRecordPrimary.PK = PK;
            securityRecordPrimary.SK = SK_GROUP;
            securityRecordPrimary.GSI1_SK = `name#${group.name.toLowerCase()}`;

            const securityRecordSecondary = new Model().populate(securityRecord);
            securityRecordSecondary.PK = PK;
            securityRecordSecondary.SK = "slug";
            securityRecordSecondary.GSI1_SK = `slug#${group.slug}`;

            const batch = new Batch(
                // User item - A
                [
                    Model,
                    "update",
                    {
                        data: await securityRecordPrimary.toStorage()
                    }
                ],
                // User item - createdOn
                [
                    Model,
                    "update",
                    {
                        data: await securityRecordSecondary.toStorage()
                    }
                ]
            );

            await batch.execute();
            return new Response(securityRecordPrimary.data);
        } catch (e) {
            return new ErrorResponse({
                code: e.code,
                message: e.message,
                data: e.data || null
            });
        }
    }
    return new NotFoundResponse(`User with id: ${id} not found!`);
};
