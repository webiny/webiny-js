const { Graph, alg } = require("graphlib");
const { join, resolve } = require("path");
const multimatch = require("multimatch");
const { allWorkspaces } = require("@webiny/project-utils/workspaces");

const createGraph = packages => {
    const graph = new Graph();
    const packageNames = packages.map(pkg => pkg.name);

    packages.forEach(({ json }) => {
        graph.setNode(json.name, json);
    });

    packages.forEach(({ json }) => {
        if (!json.dependencies && !json.devDependencies) {
            return;
        }

        [...Object.keys(json.dependencies || {}), ...Object.keys(json.devDependencies || {})].forEach(name => {
            if (packageNames.includes(name)) {
                graph.setEdge(json.name, name);
            }
        });
    });

    validateGraph(graph);

    return graph;
};

const validateGraph = graph => {
    const isAcyclic = alg.isAcyclic(graph);
    if (!isAcyclic) {
        const cycles = alg.findCycles(graph);
        const msg = ["Your packages have circular dependencies:"];
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

const getPackages = ({ script, folders, scopes }) => {
    return allWorkspaces()
        .filter(pkgPath => {
            if (!folders.length) {
                return true;
            }
            // Check if workspace path starts with any of the requested folders
            return folders.some(folder => pkgPath.startsWith(resolve(folder)));
        })
        .map(folder => {
            const json = require(join(folder, "package.json"));
            return {
                json,
                name: json.name,
                path: folder
            };
        })
        .filter(pkg => {
            return Boolean(pkg.json.scripts && pkg.json.scripts[script]);
        })
        .filter(pkg => {
            if (!scopes.length) {
                return true;
            }

            const [match] = multimatch(pkg.name, scopes);

            return Boolean(match);
        });
};

const normalizeArray = value => {
    return Array.isArray(value) ? value : [value].filter(Boolean);
};

module.exports = {
    createGraph,
    getPackages,
    normalizeArray
};
