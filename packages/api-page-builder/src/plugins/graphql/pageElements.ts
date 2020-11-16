import { hasPermission, NotAuthorizedResponse } from "@webiny/api-security";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { Response, NotFoundResponse, ErrorResponse } from "@webiny/graphql/responses";
import { Context as HandlerContext } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { SecurityContext } from "@webiny/api-security/types";
import { composeResolvers } from "@webiny/handler-graphql";

const hasRwd = ({ pbPagePermission, rwd }) => {
    if (typeof pbPagePermission.rwd !== "string") {
        return true;
    }

    return pbPagePermission.rwd.includes(rwd);
};

type Context = HandlerContext<I18NContext, SecurityContext>;

export default {
    typeDefs: /* GraphQL */ `
        type PbPageElement {
            id: ID
            createdOn: DateTime
            createdBy: PbCreatedBy
            name: String
            category: String
            type: String
            content: JSON
            preview: JSON
        }

        input PbPageElementInput {
            id: ID
            name: String
            type: String
            category: String
            content: JSON
            preview: JSON
        }

        # Response types
        type PbPageElementResponse {
            data: PbPageElement
            error: PbError
        }

        type PbPageElementListResponse {
            data: [PbPageElement]
            error: PbError
        }

        extend type PbQuery {
            listPageElements: PbPageElementListResponse
            getPageElement(id: ID!): PbPageElementResponse
        }

        extend type PbMutation {
            createPageElement(data: PbPageElementInput!): PbPageElementResponse
            updatePageElement(id: ID!, data: PbPageElementInput!): PbPageElementResponse
            deletePageElement(id: ID!): PbPageElementResponse
        }
    `,
    resolvers: {
        PbQuery: {
            getPageElement: composeResolvers<any, { id: string }, Context>(
                hasPermission("pb.page"),
                hasI18NContentPermission(),
                async (_, args, context: Context) => {
                    // If permission has "rwd" property set, but "r" is not part of it, bail.
                    const pbPagePermission = await context.security.getPermission("pb.page");
                    if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "r" })) {
                        return new NotAuthorizedResponse();
                    }

                    const id = args.id;

                    const { pageElements } = context;
                    const pageElement = await pageElements.get(id);
                    if (!pageElement) {
                        return new NotFoundResponse(`Page element "${id}" not found.`);
                    }

                    // If user can only manage own records, let's check if he owns the loaded one.
                    if (pbPagePermission?.own === true) {
                        const identity = context.security.getIdentity();
                        if (pageElement.createdBy.id !== identity.id) {
                            return new NotAuthorizedResponse();
                        }
                    }

                    return new Response(pageElement);
                }
            ),
            listPageElements: composeResolvers<any, any, Context>(
                hasPermission("pb.page"),
                hasI18NContentPermission(),
                async (_, args, context: Context) => {
                    // If permission has "rwd" property set, but "r" is not part of it, bail.
                    const pbPagePermission = await context.security.getPermission("pb.page");
                    if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "r" })) {
                        return new NotAuthorizedResponse();
                    }

                    const { pageElements } = context;

                    let list = await pageElements.list();

                    // If user can only manage own records, let's check if he owns the loaded one.
                    if (pbPagePermission?.own === true) {
                        const identity = context.security.getIdentity();
                        list = list.filter(element => element.createdBy.id === identity.id);
                    }

                    return new Response(list);
                }
            )
        },
        PbMutation: {
            createPageElement: composeResolvers<any, { data: Record<string, any> }, Context>(
                hasPermission("pb.page"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
                // If permission has "rwd" property set, but "w" is not part of it, bail.
                const pbPagePermission = await context.security.getPermission("pb.page");
                if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "w" })) {
                    return new NotAuthorizedResponse();
                }

                const { pageElements } = context;
                const { data } = args;

                try {
                    return new Response(await pageElements.create(data));
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }),
            updatePageElement: composeResolvers<
                any,
                { id: string; data: Record<string, any> },
                Context
            >(
                hasPermission("pb.page"),
                hasI18NContentPermission(),
                async (_, args, context: Context) => {
                    // If permission has "rwd" property set, but "w" is not part of it, bail.
                    const pbPagePermission = await context.security.getPermission("pb.page");
                    if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "w" })) {
                        return new NotAuthorizedResponse();
                    }

                    const { pageElements } = context;
                    const { data } = args;
                    const id = args.id;

                    const pageElement = await pageElements.get(id);
                    if (!pageElement) {
                        return new NotFoundResponse(`Page element "${id}" not found.`);
                    }

                    // If user can only manage own records, let's check if he owns the loaded one.
                    if (pbPagePermission?.own === true) {
                        const identity = context.security.getIdentity();
                        if (pageElement.createdBy.id !== identity.id) {
                            return new NotAuthorizedResponse();
                        }
                    }

                    try {
                        const changed = await pageElements.update(id, data);
                        return new Response({ ...pageElement, ...changed });
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            ),
            deletePageElement: composeResolvers<any, { id: string }, Context>(
                hasPermission("pb.page"),
                hasI18NContentPermission(),
                async (_, args, context: Context) => {
                    // If permission has "rwd" property set, but "d" is not part of it, bail.
                    const pbPagePermission = await context.security.getPermission("pb.page");
                    if (pbPagePermission && !hasRwd({ pbPagePermission, rwd: "d" })) {
                        return new NotAuthorizedResponse();
                    }

                    const { pageElements } = context;
                    const id = args.id;

                    const pageElement = await pageElements.get(id);
                    if (!pageElement) {
                        return new NotFoundResponse(`Page element "${args.id}" not found.`);
                    }

                    // If user can only manage own records, let's check if he owns the loaded one.
                    if (pbPagePermission?.own === true) {
                        const identity = context.security.getIdentity();
                        if (pageElement.createdBy.id !== identity.id) {
                            return new NotAuthorizedResponse();
                        }
                    }

                    await pageElements.delete(id);

                    return new Response(pageElement);
                }
            )
        }
    }
};
