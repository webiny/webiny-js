import { useCallback, useReducer, useEffect } from "react";
import { Graph, alg } from "graphlib";
import { useApolloClient } from "@apollo/react-hooks";
import { plugins } from "@webiny/plugins";
import { AdminInstallationPlugin } from "~/types";
import { config as appConfig } from "@webiny/app/config";

interface GetInstallersResult {
    toInstall: Installer[];
}

interface UseInstallerParams {
    isInstalled: boolean;
}

interface BaseInstaller {
    installed: string | null;
    plugin: AdminInstallationPlugin;
}

export interface Installer extends BaseInstaller {
    type: "install";
    name: string;
    title: string;
    render: AdminInstallationPlugin["render"];
    secure?: boolean;
}
interface State {
    loading: boolean;
    installers: Installer[];
    installerIndex: number;
    showLogin: boolean;
}

interface Reducer {
    (prev: State, next: Partial<State>): State;
}

export const useInstaller = (params: UseInstallerParams) => {
    const { isInstalled } = params;
    const [state, setState] = useReducer<Reducer>((prev, next) => ({ ...prev, ...next }), {
        loading: true,
        installers: [],
        installerIndex: -1,
        showLogin: false
    });
    const { loading, installers, installerIndex, showLogin } = state;

    const client = useApolloClient();

    const validateGraph = (graph: Graph): void => {
        const isAcyclic = alg.isAcyclic(graph);
        if (isAcyclic) {
            return;
        }
        const cycles = alg.findCycles(graph);
        const msg = ["Your installers have circular dependencies:"];
        cycles.forEach((cycle, index) => {
            let fromAToB = cycle.join(" --> ");
            fromAToB = `${index + 1}. ${fromAToB}`;
            const fromBToA = cycle.reverse().join(" <-- ");
            const padLength = fromAToB.length + 4;
            msg.push(fromAToB.padStart(padLength));
            msg.push(fromBToA.padStart(padLength));
        }, cycles);
        throw new Error(msg.join("\n"));
    };

    const createGraph = (installers: BaseInstaller[]): Graph => {
        const graph = new Graph();
        installers.forEach(({ plugin }) => {
            graph.setNode(plugin.name as string, plugin);
        });

        installers.forEach(({ plugin: pl }) => {
            if (Array.isArray(pl.dependencies)) {
                pl.dependencies.forEach(dep => {
                    graph.setEdge(pl.name as string, dep);
                });
            }
        });

        validateGraph(graph);

        return graph;
    };

    const getInstallers = useCallback(
        (
            installers: BaseInstaller[],
            graph: Graph,
            toInstall: Installer[] = []
        ): GetInstallersResult => {
            const leaf = graph.sinks()[0];
            if (leaf) {
                const installer = installers.find(inst => inst.plugin.name === leaf);
                if (!installer) {
                    throw new Error(`Missing installer plugin "${leaf}"!`);
                }

                graph.removeNode(leaf);
                if (!installer.installed) {
                    toInstall.push({
                        type: "install",
                        name: `${installer.plugin.name}-install`,
                        title: installer.plugin.title,
                        render: installer.plugin.render,
                        secure: installer.plugin.secure,
                        installed: null,
                        plugin: installer.plugin
                    });
                }

                return getInstallers(installers, graph, toInstall);
            }
            toInstall.sort((a, b) => {
                if (a.secure && !b.secure) {
                    return 1;
                } else if (!a.secure && b.secure) {
                    return -1;
                }
                return 0;
            });
            return { toInstall };
        },
        []
    );

    const onUser = () => {
        setState({ showLogin: false });
    };

    /**
     * If set to anything else, it breaks in AppInstaller.tsx
     */
    const showNextInstaller = (): any => {
        const prevInstaller = installers[installerIndex];

        installers[installerIndex].installed = appConfig.getKey(
            "WEBINY_VERSION",
            process.env.REACT_APP_WEBINY_VERSION as string
        );
        setState({ installers });

        if (installers.length < installerIndex + 1) {
            setState({ installerIndex: undefined });
            return;
        }

        const nextIndex = installerIndex + 1;

        let showLogin = false;
        const nextInstaller = installers[nextIndex];

        const prevSecure = prevInstaller && prevInstaller.secure;
        const nextSecure = nextInstaller && nextInstaller.secure;
        if (!prevSecure && nextSecure) {
            showLogin = true;
        }
        setState({ installerIndex: nextIndex, showLogin });
    };

    useEffect(() => {
        (async () => {
            if (isInstalled) {
                return;
            }

            const allInstallers: BaseInstaller[] = [];
            await Promise.all(
                plugins.byType<AdminInstallationPlugin>("admin-installation").map(async pl => {
                    const installed = await pl.getInstalledVersion({ client });
                    allInstallers.push({ plugin: pl, installed });
                })
            );

            const graph = createGraph(allInstallers);
            const { toInstall } = getInstallers(allInstallers, graph);
            const installers = [...toInstall];
            setState({
                installers,
                installerIndex: 0,
                loading: false,
                showLogin: toInstall.length > 0 && toInstall[0].secure
            });
        })();
    }, []);

    const isFirstInstall = installers.some(installer => installer.installed);

    return {
        loading,
        installers,
        isFirstInstall,
        installer: installers[installerIndex],
        showNextInstaller,
        showLogin,
        onUser
    };
};
