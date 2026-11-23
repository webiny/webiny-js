import fs from "fs-extra";
import path from "path";

// Pulumi always reads plugins from `$PULUMI_HOME/plugins` and has no setting to point it elsewhere,
// so that folder becomes a link to the store's plugin folder. On Windows it is a junction, which
// does not need administrator rights.
export const linkSharedPlugins = (pulumiHome: string, sharedPluginsFolder: string) => {
    fs.ensureDirSync(sharedPluginsFolder);
    fs.ensureDirSync(pulumiHome);

    const pluginsLink = path.join(pulumiHome, "plugins");
    const stat = fs.lstatSync(pluginsLink, { throwIfNoEntry: false });

    if (stat?.isSymbolicLink()) {
        if (fs.realpathSync(pluginsLink) === fs.realpathSync(sharedPluginsFolder)) {
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

// A project set up before the store existed has its plugins in its own PULUMI_HOME. Moving them
// saves downloading them again. A plugin the store already has is left behind and deleted.
function movePluginsToStore(projectPluginsFolder: string, sharedPluginsFolder: string) {
    for (const entry of fs.readdirSync(projectPluginsFolder)) {
        const target = path.join(sharedPluginsFolder, entry);
        if (fs.existsSync(target)) {
            continue;
        }

        try {
            fs.moveSync(path.join(projectPluginsFolder, entry), target);
        } catch (error) {
            // Another project moved or installed the same plugin first.
            if (!fs.existsSync(target)) {
                throw error;
            }
        }
    }
}
