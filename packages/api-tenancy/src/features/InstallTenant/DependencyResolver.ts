import { InstallationDependencyError } from "./errors.js";
import { type AppInstallationData, AppInstaller } from "./abstractions.js";

export class DependencyResolver {
    resolve(
        installers: AppInstaller.Interface[],
        requestedInstalls: AppInstallationData[]
    ): string[] {
        const nodes = new Map<string, AppInstaller.Interface>();
        const installerMap = new Map(installers.map(i => [i.appName, i]));

        // First, add all requested installers
        for (const install of requestedInstalls) {
            const installer = installerMap.get(install.app);
            if (!installer) {
                throw new InstallationDependencyError({
                    reason: `No installer found for app: ${install.app}`
                });
            }

            nodes.set(install.app, installer);
        }

        // Then, add all installers with alwaysRun === true that aren't already included
        for (const installer of installers) {
            if (installer.alwaysRun && !nodes.has(installer.appName)) {
                nodes.set(installer.appName, installer);
            }
        }

        this.validateDependencies(nodes, installerMap);
        return this.topologicalSort(nodes);
    }

    private validateDependencies(
        nodes: Map<string, AppInstaller.Interface>,
        installerMap: Map<string, AppInstaller.Interface>
    ): void {
        for (const [appName, node] of nodes) {
            for (const dep of node.dependsOn) {
                if (!installerMap.has(dep)) {
                    throw new InstallationDependencyError({
                        reason: `App "${appName}" depends on "${dep}", but no installer exists for "${dep}"`
                    });
                }

                if (!nodes.has(dep)) {
                    throw new InstallationDependencyError({
                        reason:
                            `App "${appName}" depends on "${dep}", but "${dep}" is not included in the installation request. ` +
                            `Please include "${dep}" in your installation data.`
                    });
                }
            }
        }
    }

    private topologicalSort(nodes: Map<string, AppInstaller.Interface>): string[] {
        const sorted: string[] = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();

        const visit = (appName: string, path: string[] = []): void => {
            if (visited.has(appName)) {
                return;
            }

            if (visiting.has(appName)) {
                const cycle = [...path, appName].join(" -> ");
                throw new InstallationDependencyError({
                    reason: `Circular dependency detected: ${cycle}`
                });
            }

            visiting.add(appName);
            const node = nodes.get(appName)!;

            for (const dep of node.dependsOn) {
                visit(dep, [...path, appName]);
            }

            visiting.delete(appName);
            visited.add(appName);
            sorted.push(appName);
        };

        for (const appName of nodes.keys()) {
            visit(appName);
        }

        return sorted;
    }
}
