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

    if (stat?.isSymbolicLink()) {
        if (isLinkTo(pluginsLink, sharedPluginsFolder)) {
            return;
        }
        fs.unlinkSync(pluginsLink);
    } else if (stat) {
        movePluginsToStore(pluginsLink, sharedPluginsFolder);
        fs.rmSync(pluginsLink, { recursive: true, force: true });
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

/*
 * A project set up before the store existed has its plugins in its own PULUMI_HOME. Moving them
 * saves downloading them again. A plugin the store already has is left behind and deleted. Each
 * plugin is moved to a temporary name in the store first and renamed into place, so a copy that
 * fails partway (when the project and the store are on different drives) never looks installed.
 */
function movePluginsToStore(projectPluginsFolder: string, sharedPluginsFolder: string) {
    for (const entry of fs.readdirSync(projectPluginsFolder)) {
        const source = path.join(projectPluginsFolder, entry);
        const target = path.join(sharedPluginsFolder, entry);
        if (fs.existsSync(target)) {
            continue;
        }

        const tempTarget = `${target}.${process.pid}.${Date.now()}.tmp`;
        try {
            fs.moveSync(source, tempTarget);
            fs.renameSync(tempTarget, target);
        } catch (error) {
            fs.rmSync(tempTarget, { recursive: true, force: true });

            // Another project moved or installed the same plugin first.
            if (!fs.existsSync(target)) {
                throw error;
            }
        }
    }
}
