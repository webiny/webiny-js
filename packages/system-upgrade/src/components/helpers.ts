import { ContextInterface } from "@webiny/handler/types";
import { SystemUpgrade } from "./../types";
import WebinyError from "@webiny/error";
import { compare as semverCompare, parse as semverParse, SemVer } from "semver";

const assignPluginVersion = (plugin: SystemUpgrade<any, any>): SemVer => {
    if (plugin.version instanceof SemVer) {
        return plugin.version;
    }
    const ver = semverParse(plugin.version);
    if (ver) {
        return ver;
    }
    throw new WebinyError("Could not get plugin version.", "INVALID_PLUGIN_VERSION", {
        plugin: {
            name: plugin.name,
            version: plugin.version
        }
    });
};
export const getSystemUpgradePlugins = <T extends ContextInterface>(
    context: T
): SystemUpgrade<T, SemVer>[] => {
    return (
        context.plugins
            .byType<SystemUpgrade<T, SemVer | string>>("system-upgrade")
            .map(pl => {
                return {
                    ...pl,
                    version: assignPluginVersion(pl)
                };
            })
            // we immediately sort depending on semver
            .sort((a, b) => {
                return semverCompare(a.version, b.version);
            })
    );
};

export const validateCodeVersionAgainstPlugin = (
    codeVersion: SemVer,
    plugin: SystemUpgrade<ContextInterface, SemVer>
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
): Promise<SystemUpgrade<T, SemVer>[]> => {
    const plugins = getSystemUpgradePlugins(context);
    const filteredPlugins = [];
    for (const plugin of plugins) {
        // there should be no plugin that has greater version than the codeVersion
        validateCodeVersionAgainstPlugin(codeVersion, plugin);
        try {
            const result = await plugin.isApplicable(context, codeVersion);
            if (!result) {
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
