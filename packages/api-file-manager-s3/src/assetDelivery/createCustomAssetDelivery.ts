import { createAssetDeliveryPluginLoader } from "@webiny/api-file-manager";

/**
 * !! EXPERIMENTAL !!
 *
 * This plugin is used to enable delivery of assets derived from the original asset uploaded via the FM.
 * These are usually files that go through background processing, video transcoding, image optimization, etc.
 * Since these derived files are not managed through the File Manager, the default delivery mechanism will not be able
 * to resolve them.
 *
 * With this plugin, we add a custom asset resolver, which tries to resolve the requested asset within the folder
 * it's located in, and if found, it will simply be delivered back to the client, without any transformations applied.
 */
export const createCustomAssetDelivery = () => {
    return createAssetDeliveryPluginLoader(async () => {
        return import(
            /* webpackChunkName: "customAssetDelivery" */ "./customAssets/customAssetDeliveryConfig"
        ).then(({ customAssetDeliveryConfig }) => customAssetDeliveryConfig());
    });
};
