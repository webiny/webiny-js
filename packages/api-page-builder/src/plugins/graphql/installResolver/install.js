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
    let settings = await PbSettings.load();
    if (!settings) {
        settings = new PbSettings();
    }

    const installation = settings.data.installation;
    if (installation.completed) {
        return new ErrorResponse({
            code: "PB_INSTALL_ABORTED",
            message: "Page builder is already installed."
        });
    }

    const { step } = args;

    try {
        if (!installation.stepAvailable(step)) {
            return new ErrorResponse({
                code: "PB_INSTALL_ABORTED",
                message: `Installation step ${step} not available or already executed.`
            });
        }

        if (step === 1) {
            installation.getStep(1).markAsStarted();
            const staticPageCount = await PbCategory.count({ query: { slug: "static" } });
            if (staticPageCount === 0) {
                for (let i = 0; i < categoriesData.length; i++) {
                    const instance = new PbCategory();
                    await instance.populate(categoriesData[i]).save();
                }
            }

            installation.getStep(1).markAsCompleted();
            await settings.save();
            return new Response(true);
        }

        if (step === 2) {
            installation.getStep(2).markAsStarted();
            const INSTALL_EXTRACT_DIR = await downloadInstallationFiles();
            await saveElements({ INSTALL_EXTRACT_DIR, context });

            installation.getStep(2).markAsCompleted();
            await settings.save();
            return new Response(true);
        }

        if (step === 3) {
            installation.getStep(3).markAsStarted();
            const INSTALL_EXTRACT_DIR = await downloadInstallationFiles();
            await savePages({ INSTALL_EXTRACT_DIR, context });

            installation.getStep(3).markAsCompleted();
            await settings.save();
            return new Response(true);
        }

        if (step === 4) {
            installation.getStep(4).markAsStarted();
            for (let i = 0; i < menuData.length; i++) {
                const instance = new PbMenu();
                await instance.populate(menuData[i]).save();
            }

            installation.getStep(4).markAsCompleted();
            await settings.save();
            return new Response(true);
        }

        if (step === 5) {
            installation.getStep(5).markAsStarted();
            const { name, domain } = args;
            settings.data.name = name;
            settings.data.domain = domain;

            // These IDs are always the same, so they can be hardcoded.
            settings.data.pages = {
                home: "5c86c7564527eea07b295f9d",
                notFound: "5c6860fda0b03cef2e544bd7",
                error: "5c6862e4a0b03cef2ef1dec1"
            };

            installation.getStep(5).markAsCompleted();
            await settings.save();
            return new Response(true);
        }
    } catch (e) {
        return new ErrorResponse({
            code: "PB_INSTALL_ERROR",
            message: e.message
        });
    }
};

export const isInstalled = async (root: any, args: Object, context: Object) => {
    const { PbSettings } = context.models;
    const settings = await PbSettings.load();
    if (!settings) {
        return new Response(false);
    }

    return new Response(settings.data.installation.completed);
};
