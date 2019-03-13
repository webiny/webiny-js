// @flow
import setupEntities from "./setupEntities";
import createDefaultPages from "./importData/createDefaultPages";
import createDefaultBlocks from "./importData/createDefaultBlocks";
import * as data from "./data";
import { get } from "lodash";
export default async (context: Object) => {
    setupEntities(context);
    const { CmsSettings } = context.cms.entities;

    const { Group } = context.security.entities;

    // Create Full Access security group with all of the necessary roles.
    const group = new Group();
    group.populate({ ...data.group, roles: data.roles }).save();

    await createDefaultBlocks(context);

    // Settings init.
    const cmsSettings = new CmsSettings();
    await createDefaultPages(context, { cmsSettings });
    cmsSettings.data.domain = get(context, "cms.siteUrl");


    await cmsSettings.save();
};
