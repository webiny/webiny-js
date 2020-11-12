import { ErrorResponse, Response } from "@webiny/graphql";
import { HandlerContext } from "@webiny/handler/types";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { UserData, HandlerTenancyContext, SecurityUserManagementPlugin } from "../../types";

const ensureFullAccessGroup = async (context: HandlerTenancyContext) => {
    let groupData = await context.security.groups.get("security-full-access");

    if (!groupData) {
        groupData = await context.security.groups.create({
            name: "Security - Full Access",
            description: "Grants full access to all API fields.",
            system: true,
            slug: "security-full-access",
            permissions: [{ name: "*" }]
        });
    }
    return groupData;
};

/**
 * We consider security to be installed if there is a root tenant installed.
 */
const isSecurityInstalled = async (context: HandlerTenancyContext) => {
    // Check if at least 1 user exists in the system
    const tenant = await context.security.tenants.getRoot();
    return !!tenant;
};

type InstallResolver = GraphQLFieldResolver<
    any,
    { data: UserData },
    HandlerContext & HandlerTenancyContext
>;

export const install: InstallResolver = async (root, args, context) => {
    if (await isSecurityInstalled(context)) {
        return new ErrorResponse({
            code: "SECURITY_INSTALL_ABORTED",
            message: "Security is already installed."
        });
    }

    const { data } = args;

    try {
        // Create root tenant
        const tenant = await context.security.tenants.create({ name: "Root" });
        context.security.setTenant(tenant);

        // Create full-access group
        const group = await ensureFullAccessGroup(context);

        const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
            "security-user-management"
        );

        // Create new user
        await authPlugin.createUser({ data, user: data, permanent: true }, context);
        const user = await context.security.users.create(data);

        // Link user with group for this tenant
        await context.security.tenants.linkUser(tenant, user.login, group);

        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export const isInstalled: InstallResolver = async (root, args, context) => {
    return new Response(await isSecurityInstalled(context));
};
