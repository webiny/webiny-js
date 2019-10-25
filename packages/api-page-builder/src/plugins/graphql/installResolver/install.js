import get from "lodash.get";
import categoriesData from "./importData/categoriesData";
import { ErrorResponse, Response } from "@webiny/api";
import menuData from "./importData/menusData";
import downloadInstallationFiles from "./utils/downloadInstallationFiles";
import saveElements from "./utils/saveElements";
import savePages from "./utils/savePages";

export const install = async (root: any, args: Object, context: Object) => {
    // Start the download of initial Page Builder page / block images.
    const { PbSettings, PbCategory, PbMenu } = context.models;

    // 1. Check if Page Builder is already installed.
    const settings = await PbSettings.load();
    if (settings.data.installed) {
        return new ErrorResponse({
            code: "PB_INSTALL_ABORTED",
            message: "Page builder is already installed."
        });
    }

    // 1.1 Let's immediately download the installation files.
    const INSTALL_EXTRACT_DIR = await downloadInstallationFiles();

    await console.log("skinup fileove");

    // 2. Create "Static" page category.
    const staticPageCount = await PbCategory.count({ query: { slug: "static" } });
    if (staticPageCount === 0) {
        for (let i = 0; i < categoriesData.length; i++) {
            const instance = new PbCategory();
            await instance.populate(categoriesData[i]).save();
        }
    }

    // 3. Save elements and pages.
    await Promise.all([
        savePages({ INSTALL_EXTRACT_DIR, context }), // TODO: vrati ovo
        saveElements({ INSTALL_EXTRACT_DIR, context })
    ]);

    // 4. Save menus.
    for (let i = 0; i < menuData.length; i++) {
        const instance = new PbMenu();
        await instance.populate(menuData[i]).save();
    }

    // 5. Finally, set "name", "domain" and "installed" values.
    const { name, domain } = args;
    // settings.data.installed = true; TODO: vrati ovo
    settings.data.name = name;
    settings.data.domain = domain;
    await settings.save();
    return new Response(true);
};

export const isInstalled = async (root: any, args: Object, context: Object) => {
    const { PbSettings } = context.models;
    const settings = await PbSettings.load();
    return get(settings, "data.installed") || false;
};
