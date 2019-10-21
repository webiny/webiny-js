import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApolloClient } from "react-apollo";
import styled from "@emotion/styled";
import { CircularProgress } from "@webiny/ui/Progress";
import { Graph, alg } from "graphlib";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";

export const Wrapper = styled("section")({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "100vh",
    color: "var(--mdc-theme-on-surface)"
});

export const InstallContent = styled("div")({
    maxWidth: 800,
    margin: "0 auto 25px auto",
    ".mdc-elevation--z2": {
        borderRadius: 4,
        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.15)"
    }
});

export const InnerContent = styled("div")({
    padding: 25,
    position: "relative"
});

const validateGraph = graph => {
    const isAcyclic = alg.isAcyclic(graph);
    if (!isAcyclic) {
        const cycles = alg.findCycles(graph);
        let msg = ["Your installers have circular dependencies:"];
        cycles.forEach((cycle, index) => {
            let fromAToB = cycle.join(" --> ");
            fromAToB = `${(index += 1)}. ${fromAToB}`;
            const fromBToA = cycle.reverse().join(" <-- ");
            const padLength = fromAToB.length + 4;
            msg.push(fromAToB.padStart(padLength));
            msg.push(fromBToA.padStart(padLength));
        }, cycles);
        msg = msg.join("\n");
        throw new Error(msg);
    }
};

const createGraph = plugins => {
    const graph = new Graph();
    plugins.forEach(pl => {
        graph.setNode(pl.name, pl);
    });

    plugins.forEach(pl => {
        if (Array.isArray(pl.dependencies)) {
            pl.dependencies.forEach(dep => {
                graph.setEdge(pl.name, dep);
            });
        }
    });

    validateGraph(graph);

    return graph;
};

const Install = ({ plugins, children, security }) => {
    const client = useApolloClient();
    const [ready, setReady] = useState(false);
    const [login, setLogin] = useState(false);
    const [user, setUser] = useState(null);
    const [current, setCurrentInstaller] = useState(null);
    const toInstall = useRef([]);
    const graph = useRef(null);

    const onUser = user => {
        setUser(user);
        setLogin(false);
        console.log("onUser", user);
    };

    const nextInstaller = () => {
        const currentIndex = !current
            ? -1
            : toInstall.current.findIndex(inst => inst.plugin.name === current.plugin.name);
        const nextIndex = currentIndex + 1;

        if (toInstall.current[nextIndex].plugin.secure && (!current || !current.plugin.secure)) {
            console.log("SET LOGIN");
            setLogin(true);
        }

        //toInstall.current[currentIndex].installed = true;

        if (!toInstall.current.find(inst => !inst.installed)) {
            setCurrentInstaller(null);
            setReady(true);
            return;
        }

        setCurrentInstaller(toInstall.current[nextIndex]);
    };

    const getInstallers = useCallback((list = []) => {
        const installers = toInstall.current;
        const leaf = graph.current.sinks()[0];
        if (leaf) {
            const installer = installers.find(inst => inst.plugin.name === leaf);
            graph.current.removeNode(leaf);
            if (!installer.installed) {
                list.push(installer);
            }
            return getInstallers(list);
        }
        return list;
    }, []);

    useEffect(() => {
        (async () => {
            await Promise.all(
                plugins.map(async pl => {
                    const installed = await pl.isInstalled({ client });
                    toInstall.current.push({ plugin: pl, installed });
                })
            );

            graph.current = createGraph(plugins);
            toInstall.current = getInstallers();
            nextInstaller();
        })();
    }, []);

    if (!ready && !current && !login) {
        return <CircularProgress label={"Checking apps..."} />;
    }

    if (login || current) {
        return (
            <SplitView>
                <LeftPanel span={2}>
                    <PluginsList
                        allPlugins={toInstall.current.map(inst => inst.plugin)}
                        current={current}
                        login={login}
                    />
                </LeftPanel>
                <RightPanel span={10}>
                    {login && React.cloneElement(security, { onUser })}
                    {!login && (
                        <Wrapper>
                            <InstallContent>
                                <InnerContent>
                                    {current.plugin.render({ onInstalled: nextInstaller })}
                                </InnerContent>
                            </InstallContent>
                        </Wrapper>
                    )}
                </RightPanel>
            </SplitView>
        );
    }

    return React.cloneElement(security, null, children);
};

const PluginsList = ({ allPlugins, current, login }) => {
    const renderList = () => {
        const loginItem = <li key={"login"}>{login && "-> "}Login Required</li>;

        const items = [];
        for (let i = 0; i < allPlugins.length; i++) {
            const plugin = allPlugins[i];
            const prev = i === 0 ? null : allPlugins[i - 1];
            if ((!prev || !prev.secure) && plugin.secure) {
                items.push(loginItem);
            }
            const active = !login && plugin.name === current.plugin.name;
            items.push(
                <li key={plugin.name}>
                    {active && "-> "}
                    {plugin.name}
                </li>
            );
        }
        return items;
    };

    return <ul>{renderList()}</ul>;
};

export default Install;
