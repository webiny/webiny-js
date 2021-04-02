const { createGraph, getPackages } = require("./utils");
const archy = require("archy");
const { green } = require("chalk");

module.exports = async ({ json, scope, folder, depth, distinct }) => {
    let folders = [],
        scopes = [];

    if (folder) {
        folders = Array.isArray(folder) ? folder : [folder];
    }

    if (scope) {
        scopes = Array.isArray(scope) ? scope : [scope];
    }

    const packages = getPackages({ scopes, folders });
    const allPackages = {
        list: getPackages(),
        graph: createGraph(getPackages())
    };

    const tree = buildTree({ packages, allPackages, depth });
    if (json) {
        if (distinct) {
            console.log(JSON.stringify(getDistinctPackages(tree), null, 2));
        } else {
            console.log(JSON.stringify(tree, null, 2));
        }

        return;
    }

    if (distinct) {
        const distinctPackagesArchyTree = buildDistinctPackagesArchyTree(tree);
        console.log(green(archy(distinctPackagesArchyTree)));
    } else {
        const archyTree = buildArchyTree(tree);
        console.log(green(archy(archyTree)));
    }
};

const getDistinct = ({ fragment, list }) => {
    for (const packageName in fragment) {
        list[packageName] = true;

        const dependencies = fragment[packageName];
        const hasDependencies = dependencies && Object.keys(dependencies).length;
        if (hasDependencies) {
            getDistinct({ fragment: dependencies, list });
        }
    }
};

const getDistinctPackages = tree => {
    const list = {};
    getDistinct({ fragment: tree, list });
    return Object.keys(list);
};

const buildTree = ({ packages, allPackages, depth }) => {
    const tree = {};
    for (let i = 0; i < packages.length; i++) {
        buildNode({ tree, currentPackage: packages[i].name, allPackages, depth, currentDepth: 1 });
    }
    return tree;
};

const buildNode = ({ tree, currentPackage, allPackages, depth, currentDepth }) => {
    const dependencies = allPackages.graph.outEdges(currentPackage);
    if (dependencies) {
        if (currentDepth < depth) {
            tree[currentPackage] = {};

            for (let i = 0; i < dependencies.length; i++) {
                const dependency = dependencies[i];
                buildNode({
                    tree: tree[currentPackage],
                    currentPackage: dependency.w,
                    allPackages,
                    depth,
                    currentDepth: currentDepth + 1
                });
            }
        } else {
            tree[currentPackage] = null;
        }
    }
};

const buildArchyTree = tree => {
    const currentNode = { label: "Found packages:", nodes: [] };
    buildArchyNodes({ packages: tree, currentNode });
    return currentNode;
};

const buildDistinctPackagesArchyTree = tree => {
    const distinctPackages = getDistinctPackages(tree);
    return {
        label: "Found packages:",
        nodes: distinctPackages.map(item => ({ label: item }))
    };
};

const buildArchyNodes = ({ packages, currentNode }) => {
    for (const packageName in packages) {
        const newNode = { label: packageName, nodes: [] };
        currentNode.nodes.push(newNode);

        const dependencies = packages[packageName];
        const hasDependencies = dependencies && Object.keys(dependencies).length;
        if (hasDependencies) {
            buildArchyNodes({ packages: dependencies, currentNode: newNode });
        }
    }
};
