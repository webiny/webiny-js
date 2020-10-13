import { Batch } from "@commodo/fields-storage";
import { Response, ErrorResponse } from "@webiny/graphql";

export default async (_, { data }, context) => {
    const Model = context.models.Security;
    const { SecurityGroup } = context.models;

    try {
        const identity = context.security.getIdentity();
        const group = new SecurityGroup().populate({
            createdBy: identity,
            description: data.description,
            name: data.name,
            slug: data.slug,
            permissions: data.permissions
        });

        const PK = `G#${group.id}`;
        const GSI1_PK = "Group";

        const securityRecordPrimary = new Model();
        securityRecordPrimary.PK = PK;
        securityRecordPrimary.SK = "A";
        securityRecordPrimary.GSI1_PK = GSI1_PK;
        securityRecordPrimary.GSI1_SK = `name#${group.name.toLowerCase()}`;
        securityRecordPrimary.GSI_DATA = group;
        securityRecordPrimary.data = group;

        const securityRecordSecondary = new Model();
        securityRecordSecondary.PK = PK;
        securityRecordSecondary.SK = "slug";
        securityRecordSecondary.GSI1_PK = GSI1_PK;
        securityRecordSecondary.GSI1_SK = `slug#${group.slug}`;
        securityRecordSecondary.GSI_DATA = group;
        securityRecordSecondary.data = group;
        // TODO: Model "create" didn't invoked the "beforeCreate" hooks
        const batch = new Batch(
            // group item - A
            [securityRecordPrimary, "save"],
            // group item - slug
            [securityRecordSecondary, "save"]
        );

        await batch.execute();
        return new Response(securityRecordPrimary.data);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};
