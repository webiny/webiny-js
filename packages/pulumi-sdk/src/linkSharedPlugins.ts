import fs from "fs-extra";
import path from "path";

/*
 * Pulumi always reads plugins from `$PULUMI_HOME/plugins` and has no setting to point it elsewhere,
 * so that folder becomes a link to the store's plugin folder. On Windows it is a junction, which
 * does not need administrator rights.
 */
export const linkSharedPlugins = (pulumiHome: string, sharedPluginsFolder: string) => {
    fs.ensureDirSync(sharedPluginsFolder);
    fs.ensureDirSync(pulumiHome);

    const pluginsLink = path.join(pulumiHome, "plugins");
    const stat = fs.lstatSync(pluginsLink, { throwIfNoEntry: false });

    // A real folder is left alone, and Pulumi keeps this project's plugins in it, unshared.
    if (stat && !stat.isSymbolicLink()) {
        return;
    }

    if (stat) {
        if (isLinkTo(pluginsLink, sharedPluginsFolder)) {
            return;
        }
        fs.unlinkSync(pluginsLink);
    }

    try {
        fs.symlinkSync(sharedPluginsFolder, pluginsLink, "junction");
    } catch (error) {
        // Another run in the same project created the link first.
        if (error.code !== "EEXIST") {
            throw error;
        }
    }
};

/*
 * A link whose target no longer exists, for example one copied from another machine or restored
 * from a CI cache under a different home folder, counts as pointing somewhere else.
 */
function isLinkTo(link: string, folder: string) {
    if (!fs.existsSync(link)) {
        return false;
    }

    const linkTarget = fs.realpathSync(link);
    const folderPath = fs.realpathSync(folder);
    return linkTarget === folderPath;
}
