const fs = require("fs");
const path = require("path");
const fsExtra = require("fs-extra");

const checkFiles = files => {
    for (const initialFile of files) {
        const file = createFullFile(initialFile);
        if (!fs.existsSync(file)) {
            /**
             * We throw error because if any of the files does not exist, it should not go any further.
             */
            throw new Error(`There is no file "${file}".`);
        }
    }
};

const createBackupFileName = file => {
    const ext = `.${file.split(".").pop()}`;

    const now = Math.floor(Date.now() / 1000);

    const backup = file.replace(new RegExp(`${ext}$`), `.${now}${ext}`);

    const backupFile = createFullFile(backup);
    if (!fs.existsSync(backupFile)) {
        return backup;
    }
    throw new Error(`Backup file "${backupFile}" already exists.`);
};

const createFullFile = file => {
    return path.join(process.cwd(), file);
};
/**
 *
 * @param context {CliContext}
 * @param initialTargets {{source: string, destination: string}[]}
 * @param createBackup: {boolean}
 */
const copyFiles = (context, initialTargets, createBackup = true) => {
    context.info("Copying files...");
    /**
     * First check if source and target files exist and create a backup file name.
     * @type {{source: string, destination: string, backup: string}[]}
     */
    const targets = [];
    for (const target of initialTargets) {
        /**
         * No need to check target.destination because it might not exist.
         */
        checkFiles([target.source]);
        let backup = false;
        if (createBackup) {
            try {
                backup = createBackupFileName(target.destination);
            } catch (ex) {
                context.error(ex.message);
                process.exit(1);
            }
        }

        targets.push({
            source: target.source,
            destination: target.destination,
            backup
        });
    }
    /**
     * Then:
     * - make backups of the targets files
     * - copy new files to their destinations
     */
    if (createBackup) {
        const backups = [];
        context.info("Creating backups...");
        for (const target of targets) {
            const destination = createFullFile(target.destination);
            if (!fs.existsSync(destination)) {
                continue;
            }
            try {
                fs.copyFileSync(destination, createFullFile(target.backup));
                context.info(`Backed up "${target.destination}" to "${target.backup}".`);
                backups.push(target.backup);
            } catch (ex) {
                context.error(
                    `Could not create backup "${target.destination}" to "${target.backup}".`
                );
                for (const backup of backups) {
                    context.info(`Removing created backup "${backup}".`);
                    fs.unlinkSync(createFullFile(backup));
                }
                process.exit(1);
            }
        }
    }

    const files = [];
    context.info("Copying new files...");
    for (const target of targets) {
        try {
            fs.copyFileSync(createFullFile(target.source), createFullFile(target.destination));
            context.info(`Copying new file "${target.source}" to "${target.destination}".`);
            files.push({
                destination: target.destination,
                backup: target.backup
            });
        } catch (ex) {
            context.error(`Could not copy new file "${target.source}" to "${target.destination}".`);
            for (const file of files) {
                if (!file.backup) {
                    continue;
                }
                context.info(`Restoring backup file "${file.backup}" to "${file.destination}".`);
                fs.copyFileSync(createFullFile(file.backup), createFullFile(file.destination));
                fs.unlinkSync(createFullFile(file.backup));
            }
            process.exit(1);
        }
    }
    context.info("File copying complete!");
};

/**
 * @param context {CliContext}
 * @param targets {{source: string, destination: string}[]}
 */
const copyFolders = (context, targets) => {
    context.info(`Copy folders...`);

    for (const target of targets) {
        fsExtra.copySync(target.source, target.destination);
    }
};

const deleteFiles = (context, files) => {
    context.info("Deleting files...");
    for (const file of files) {
        const target = createFullFile(file);
        if (fs.existsSync(target) === false) {
            continue;
        }
        context.info(`Removing file "${file}".`);
        fs.unlinkSync(target);
    }
};

module.exports = {
    copyFolders,
    copyFiles,
    deleteFiles
};
