import { ErrorResponse, Response } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const initialEnvironment = {
    name: "Production",
    slug: "production",
    description: "This is the production environment"
};

const initialEnvironmentAlias = {
    slug: "production",
    name: "Production",
    description: `This is the "production" environment alias`
};

const initialContentModelGroup = {
    name: "Ungrouped",
    slug: "ungrouped",
    description: "A generic content model group",
    icon: "fas/star"
};

export const install: GraphQLFieldResolver = async (root, args, context) => {
    const {
        CmsSettings,
        CmsEnvironment,
        CmsEnvironmentAlias,
        CmsContentModelGroup
    } = context.models;

    const cmsEnvironment = new CmsEnvironment();
    const cmsEnvironmentAlias = new CmsEnvironmentAlias();
    const cmsContentModelGroup = new CmsContentModelGroup();

    try {
        const settings = await CmsSettings.load();
        if (await settings.data.installed) {
            return new ErrorResponse({
                code: "CMS_INSTALL_ABORTED",
                message: "Cms -> The app is already installed."
            });
        }
        // Create a production environment
        const cmsEnvironmentProduction = await cmsEnvironment.populate({
            name: initialEnvironment.name,
            slug: initialEnvironment.slug,
            description: initialEnvironment.description
        });
        cmsEnvironmentProduction.initial = true;
        await cmsEnvironmentProduction.save();

        // Create the "Production" environment alias and link it to the "Production" environment
        await cmsEnvironmentAlias
            .populate({
                name: initialEnvironmentAlias.name,
                slug: initialEnvironmentAlias.slug,
                description: initialEnvironmentAlias.description,
                environment: cmsEnvironmentProduction.id
            })
            .save();

        // Create a default Content Model group
        await cmsContentModelGroup
            .populate({
                name: initialContentModelGroup.name,
                slug: initialContentModelGroup.slug,
                description: initialContentModelGroup.description,
                icon: initialContentModelGroup.icon,
                environment: cmsEnvironmentProduction.id
            })
            .save();

        // All done here
        settings.data.installed = true;
        await settings.save();
        return new Response(true);
    } catch (e) {
        return new ErrorResponse({
            code: "CMS_INSTALLATION_ERROR",
            message: e.message,
            data: e.data
        });
    }
};

export const isInstalled: GraphQLFieldResolver = async (root, args, context) => {
    const { CmsSettings } = context.models;
    const settings = await CmsSettings.load();
    return new Response(settings.data.installed);
};
