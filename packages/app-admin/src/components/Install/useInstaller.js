import { useCallback, useReducer, useEffect } from "react";
import { Graph, alg } from "graphlib";
import { useApolloClient } from "react-apollo";
import { getPlugins } from "@webiny/plugins";

export const useInstaller = () => {
    const [{ loading, installers, installerIndex, showLogin }, setState] = useReducer(
        (prev, next) => ({ ...prev, ...next }),
        {
            loading: true,
            installers: [],
            installerIndex: -1,
            showLogin: false
        }
    );

    const client = useApolloClient();

    const validateGraph = graph => {
        const isAcyclic = alg.isAcyclic(graph);
        if (!isAcyclic) {
            const cycles = alg.findCycles(graph);
            let msg = ["Your installers have circular dependencies:"];
            cycles.forEach((cycle, index) => {
                let fromAToB = cycle.join(" --> ");
                fromAToB = `${index + 1}. ${fromAToB}`;
                const fromBToA = cycle.reverse().join(" <-- ");
                const padLength = fromAToB.length + 4;
                msg.push(fromAToB.padStart(padLength));
                msg.push(fromBToA.padStart(padLength));
            }, cycles);
            msg = msg.join("\n");
            throw new Error(msg);
        }
    };

    const createGraph = installers => {
        const graph = new Graph();
        installers.forEach(({ plugin }) => {
            graph.setNode(plugin.name, plugin);
        });

        installers.forEach(({ plugin: pl }) => {
            if (Array.isArray(pl.dependencies)) {
                pl.dependencies.forEach(dep => {
                    graph.setEdge(pl.name, dep);
                });
            }
        });

        validateGraph(graph);

        return graph;
    };

    const getInstallers = useCallback((installers, graph, list = []) => {
        const leaf = graph.sinks()[0];
        if (leaf) {
            const installer = installers.find(inst => inst.plugin.name === leaf);
            graph.removeNode(leaf);
            if (!installer.installed) {
                list.push(installer);
            }
            return getInstallers(installers, graph, list);
        }
        return list;
    }, []);

    const onUser = () => {
        setState({ showLogin: false });
    };

    const showNextInstaller = () => {
        const prevInstaller = installers[installerIndex];

        installers[installerIndex].installed = true;
        setState({ installers });

        if (installers.length < installerIndex + 1) {
            setState({ installerIndex: null });
            return;
        }

        const nextIndex = installerIndex + 1;

        let showLogin = false;
        const nextInstaller = installers[nextIndex];

        const prevSecure = prevInstaller && prevInstaller.plugin.secure;
        const nextSecure = nextInstaller && nextInstaller.plugin.secure;
        if (!prevSecure && nextSecure) {
            showLogin = true;
        }
        setState({ installerIndex: nextIndex, showLogin });
    };

    useEffect(() => {
        (async () => {
            const allInstallers = [];
            await Promise.all(
                getPlugins("install").map(async pl => {
                    const installed = await pl.isInstalled({ client });
                    allInstallers.push({ plugin: pl, installed });
                })
            );

            const graph = createGraph(allInstallers);
            const installers = getInstallers(allInstallers, graph);
            setState({ installers, installerIndex: 0, loading: false });
        })();
    }, []);

    return {
        loading,
        installers,
        installer: installers[installerIndex],
        showNextInstaller,
        showLogin,
        onUser
    };
};
