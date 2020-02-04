import { ErrorResponse, Response } from "@webiny/api";
import downloadInstallationFiles from "./utils/downloadInstallationFiles";
import saveElements from "./utils/saveElements";
import savePages from "./utils/savePages";
import path from "path";
import loadJson from "load-json-file";
import got from "got";

export const install = async (
    root: any,
    args: {[key: string]: any},
    context: {[key: string]: any}
) => {
    // Start the download of initial Page Builder page / block images.
    const { PbSettings, PbCategory, PbMenu, PbPage } = context.models;

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
            const INSTALL_EXTRACT_DIR = await downloadInstallationFiles();
            const categoriesData: {[key: string]: any}[] = await loadJson(
                path.join(INSTALL_EXTRACT_DIR, "data/categoriesData.json")
            );
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
            const INSTALL_EXTRACT_DIR = await downloadInstallationFiles();
            const menusData: {[key: string]: any}[] = await loadJson(
                path.join(INSTALL_EXTRACT_DIR, "data/menusData.json")
            );
            installation.getStep(4).markAsStarted();
            for (let i = 0; i < menusData.length; i++) {
                const existing = await PbMenu.count({
                    query: { deleted: { $in: [true, false] }, id: menusData[i].id }
                });

                if (existing) {
                    continue;
                }
                const instance = new PbMenu();
                await instance.populate(menusData[i]).save();
            }

            installation.getStep(4).markAsCompleted();
            await settings.save();
            return new Response(true);
        }

        if (step === 5) {
            installation.getStep(5).markAsStarted();
            const { name, domain } = args.data;
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

            // Asynchronously send a GET request to each page so that the SSR cache gets populated.
            const initialPages = await PbPage.find();
            for (let i = 0; i < initialPages.length; i++) {
                const url = await initialPages[i].fullUrl;
                try {
                    await got(url, {
                        ...args,
                        timeout: 200,
                        retry: 0
                    });
                } catch {
                    // Do nothing.
                }
            }

            return new Response(true);
        }
    } catch (e) {
        return new ErrorResponse({
            code: "PB_INSTALL_ERROR",
            message: e.message
        });
    }
};

export const isInstalled = async (
    root: any,
    args: {[key: string]: any},
    context: {[key: string]: any}
) => {
    const { PbSettings } = context.models;
    const settings = await PbSettings.load();
    if (!settings) {
        return new Response(false);
    }

    return new Response(settings.data.installation.completed);
};
