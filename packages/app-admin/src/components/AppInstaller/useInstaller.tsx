import React, { useCallback, useReducer, useEffect, Suspense } from "react";
import { Graph, alg } from "graphlib";
import { sort, gt, lte } from "semver";
import { useApolloClient } from "@apollo/react-hooks";
import { plugins } from "@webiny/plugins";
import { AdminInstallationPlugin } from "~/types";
import { CircularProgress } from "@webiny/ui/Progress";

const Loader = ({ children, ...props }) => (
    <Suspense fallback={<CircularProgress label={"Loading..."} />}>
        {React.cloneElement(children, props)}
    </Suspense>
);

export const useInstaller = () => {
    const [{ loading, installers, installerIndex, showLogin, skippingVersions }, setState] =
        useReducer((prev, next) => ({ ...prev, ...next }), {
            loading: true,
            installers: [],
            installerIndex: -1,
            showLogin: false,
            skippingVersions: false
        });

    const client = useApolloClient();

    const validateGraph = graph => {
        const isAcyclic = alg.isAcyclic(graph);
        if (!isAcyclic) {
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

    const getInstallers = useCallback((installers, graph, toInstall = [], toUpgrade = []) => {
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
                    installed: false
                });
            } else {
                const upgrades = (installer.plugin.upgrades || []).filter(({ version }) => {
                    return (
                        lte(version, process.env.REACT_APP_WEBINY_VERSION) &&
                        gt(version, installer.installed)
                    );
                });

                if (upgrades.length > 1) {
                    const availableUpgrades = sort(upgrades.map(u => u.version));
                    const latestUpgrade = availableUpgrades[availableUpgrades.length - 1];
                    setState({
                        skippingVersions: {
                            current: installer.installed,
                            latest: latestUpgrade,
                            availableUpgrades
                        }
                    });
                } else if (upgrades.length === 1) {
                    toUpgrade.push({
                        type: "upgrade",
                        name: `${installer.plugin.name}-upgrade`,
                        title: installer.plugin.title,
                        secure: true,
                        installed: false,
                        render({ onInstalled }) {
                            const Component = upgrades[0].getComponent();
                            return (
                                <Loader>
                                    <Component onInstalled={onInstalled} />
                                </Loader>
                            );
                        }
                    });
                }
            }
            return getInstallers(installers, graph, toInstall, toUpgrade);
        }
        toInstall.sort((a, b) => {
            if (a.secure && !b.secure) {
                return 1;
            } else if (!a.secure && b.secure) {
                return -1;
            }
            return 0;
        });
        return { toInstall, toUpgrade };
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

        const prevSecure = prevInstaller && prevInstaller.secure;
        const nextSecure = nextInstaller && nextInstaller.secure;
        if (!prevSecure && nextSecure) {
            showLogin = true;
        }
        setState({ installerIndex: nextIndex, showLogin });
    };

    useEffect(() => {
        (async () => {
            const allInstallers = [];
            await Promise.all(
                plugins.byType<AdminInstallationPlugin>("admin-installation").map(async pl => {
                    const installed = await pl.getInstalledVersion({ client });
                    allInstallers.push({ plugin: pl, installed });
                })
            );

            const graph = createGraph(allInstallers);
            const { toInstall, toUpgrade } = getInstallers(allInstallers, graph);
            const installers = [...toUpgrade, ...toInstall];
            setState({
                installers,
                installerIndex: 0,
                loading: false,
                showLogin: toUpgrade.length > 0 || (toInstall.length > 0 && toInstall[0].secure)
            });
        })();
    }, []);

    return {
        loading,
        installers,
        installer: installers[installerIndex],
        showNextInstaller,
        showLogin,
        onUser,
        skippingVersions
    };
};
