import { ContextInterface } from "@webiny/handler/types";
import { SystemUpgrade } from "./../types";
import WebinyError from "@webiny/error";
import { compare as semverCompare, parse as semverParse, SemVer } from "semver";

export interface SystemUpgradeWithVersion<T extends ContextInterface>
    extends Omit<SystemUpgrade<T>, "version"> {
    version: SemVer;
}

export const validatePluginVersion = <T extends ContextInterface>(pl: SystemUpgrade<T>): SemVer => {
    const ver = semverParse(pl.version);
    if (ver) {
        return ver;
    }
    throw new WebinyError("Plugin version is not a valid semver value.", "INVALID_VERSION", {
        plugin: {
            name: pl.name,
            version: pl.version
        }
    });
};

export const getSystemUpgradePlugins = <T extends ContextInterface>(context: T) => {
    return (
        context.plugins
            .byType<SystemUpgrade<T>>("system-upgrade")
            .map<SystemUpgradeWithVersion<T>>(pl => {
                return {
                    ...pl,
                    version: validatePluginVersion(pl)
                };
            })
            // we immediately sort depending on semver
            .sort((a, b) => {
                return semverCompare(a.version, b.version);
            })
            // and reverse to check which plugins do we run
            .reverse()
    );
};

export const validateCodeVersionAgainstPlugin = (
    codeVersion: SemVer,
    plugin: SystemUpgradeWithVersion<ContextInterface>
) => {
    if (semverCompare(plugin.version, codeVersion) !== 1) {
        return;
    }
    throw new WebinyError(
        "Plugin has greater version than the code version is allowing.",
        "PLUGIN_VERSION_ERROR",
        {
            version: codeVersion.format(),
            plugin: {
                name: plugin.name,
                version: plugin.version.format()
            }
        }
    );
};

export const filterPlugins = async <T extends ContextInterface>(
    context: T,
    codeVersion: SemVer
): Promise<SystemUpgradeWithVersion<T>[]> => {
    const plugins = getSystemUpgradePlugins(context);
    const filteredPlugins = [];
    for (const plugin of plugins) {
        // there should be no plugin that has greater version than the codeVersion
        validateCodeVersionAgainstPlugin(codeVersion, plugin);
        try {
            const result = await plugin.isApplicable(context, codeVersion);
            if (!result) {
                // todo determine if to skip all next plugins
                // or just this one
                continue;
            }
        } catch (ex) {
            throw new WebinyError(
                "Could not check if plugin is applicable to run the upgrade.",
                "PLUGIN_IS_APPLICABLE_ERROR",
                {
                    version: codeVersion,
                    plugin: {
                        name: plugin.name,
                        version: plugin.version.format()
                    }
                }
            );
        }
        filteredPlugins.push(plugin);
    }
    return filteredPlugins.sort((a, b) => {
        return semverCompare(a.version, b.version);
    });
};

export const parseCodeVersion = <T extends ContextInterface>(context: T): SemVer => {
    const codeVersion: SemVer | null = semverParse(context.WEBINY_VERSION);
    if (codeVersion) {
        return codeVersion;
    }
    throw new WebinyError("Could not figure minimum upgrade version.", "MIN_VERSION_ERROR", {
        version: context.WEBINY_VERSION
    });
};
