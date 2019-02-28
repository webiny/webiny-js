// @flow
import setupEntities from "./setupEntities";
import createDefaultPages from "./importData/createDefaultPages";
import createDefaultBlocks from "./importData/createDefaultBlocks";
import * as data from "./data";
import { get } from "lodash";
export default async (context: Object) => {
    setupEntities(context);
    const { Menu, CmsSettings } = context.cms.entities;

    const { Group } = context.security.entities;

    // Create Full Access security group with all of the necessary roles.
    const group = new Group();
    group.populate({ ...data.group, roles: data.roles }).save();

    const menu = new Menu();
    menu.populate({
        title: "Demo Menu",
        slug: "demo-menu",
        description: "This is a demo menu.",
        items: [
            {
                type: "cms-menu-item-link",
                title: "Link 1",
                url: "https://www.google.com",
                id: "jopxai1f"
            },
            {
                type: "cms-menu-item-link",
                title: "Link 2",
                url: "https://www.duckduckgo.com",
                id: "jopxaxqh"
            }
        ]
    });

    await menu.save();

    await createDefaultBlocks(context);

    // Settings init.
    const cmsSettings = new CmsSettings();
    await createDefaultPages(context, { cmsSettings });
    cmsSettings.data.domain = get(context, "cms.siteUrl");

    await cmsSettings.save();
};
