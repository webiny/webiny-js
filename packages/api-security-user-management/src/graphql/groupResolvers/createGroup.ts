import { Response, ErrorResponse } from "@webiny/graphql";
import { createSecurityGroup } from "./utils";

export default async (_, { data }, context) => {
    const Model = context.models.SECURITY;
    const { SecurityGroup } = context.models;

    try {
        const identity = context.security.getIdentity();
        const group = new SecurityGroup().populate({
            createdBy: identity,
            description: data.description,
            locales: data.locales,
            name: data.name,
            slug: data.slug,
            permissions: data.permissions
        });

        const securityRecordPrimary = await createSecurityGroup({ Model, group });

        return new Response(securityRecordPrimary.data);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};
