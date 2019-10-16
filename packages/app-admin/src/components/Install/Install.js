import React, { useState, useEffect, useRef } from "react";
import { useApolloClient } from "react-apollo";
import styled from "@emotion/styled";
import { CircularProgress } from "@webiny/ui/Progress";
import { Graph, alg } from "graphlib";
import { EmptyLayout } from "@webiny/app-admin/components/EmptyLayout";

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

const Install = ({ plugins, children }) => {
    const client = useApolloClient();
    const [ready, setReady] = useState(false);
    const [currentInstallation, setCurrentInstallation] = useState(null);
    const toInstall = useRef([]);
    const graph = useRef(null);

    const executeGraph = async () => {
        const installers = toInstall.current;
        const leaf = graph.current.sinks()[0];
        if (leaf) {
            const installer = installers.find(inst => inst.plugin.name === leaf);
            graph.current.removeNode(leaf);
            if (!installer.installed) {
                setCurrentInstallation(installer.plugin);
            } else {
                executeGraph();
            }

            return;
        }

        setCurrentInstallation(null);
        setReady(true);
    };

    useEffect(() => {
        (async () => {
            await Promise.all(
                plugins.map(async pl => {
                    const installed = await pl.isInstalled({ client });
                    toInstall.current.push({ plugin: pl, installed });
                })
            );

            graph.current = createGraph(plugins);
            executeGraph();
        })();
    }, []);

    if (!ready && !currentInstallation) {
        return <CircularProgress label={"Checking apps..."} />;
    }

    if (currentInstallation) {
        return (
            <EmptyLayout>
                <Wrapper>
                    <InstallContent>
                        <InnerContent>
                            {currentInstallation.render({ onInstalled: executeGraph })}
                        </InnerContent>
                    </InstallContent>
                </Wrapper>
            </EmptyLayout>
        );
    }

    return children;
};

export default Install;
