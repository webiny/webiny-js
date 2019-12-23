var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ErrorResponse, Response } from "@webiny/api";
export const install = (root, args, context) => __awaiter(void 0, void 0, void 0, function* () {
    // Start the download of initial Page Builder page / block images.
    const { FilesSettings } = context.models;
    try {
        const settings = yield FilesSettings.load();
        if (yield settings.data.installed) {
            return new ErrorResponse({
                code: "FILES_INSTALL_ABORTED",
                message: "File Manager is already installed."
            });
        }
        if (args.srcPrefix) {
            settings.data.srcPrefix = args.srcPrefix;
        }
        settings.data.installed = true;
        yield settings.save();
        return new Response(true);
    }
    catch (e) {
        return new ErrorResponse({
            code: "FILES_INSTALL_ERROR",
            message: e.message
        });
    }
});
export const isInstalled = (root, args, context) => __awaiter(void 0, void 0, void 0, function* () {
    const { FilesSettings } = context.models;
    const settings = yield FilesSettings.load();
    return new Response(settings.data.installed);
});
