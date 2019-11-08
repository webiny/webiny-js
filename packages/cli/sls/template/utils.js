const { join } = require("path");
const { isEmpty, path } = require("ramda");
const { Graph, alg } = require("graphlib");
const traverse = require("traverse");
const { utils } = require("@serverless/core");
const { trackComponent } = require("@webiny/tracking");
const { red } = require("chalk");
const debug = require("debug");

const getOutputs = allComponents => {
    const outputs = {};

    for (const alias in allComponents) {
        outputs[alias] = allComponents[alias].outputs;
    }

    return outputs;
};

const resolveObject = (object, context) => {
    const regex = /\${(\w*:?[\w\d.-]+)}/g;

    const resolvedObject = traverse(object).forEach(function(value) {
        const matches = typeof value === "string" ? value.match(regex) : null;
        if (matches) {
            let newValue = value;
            for (const match of matches) {
                const propPath = match.substring(2, match.length - 1).split(".");
                const propValue = path(propPath, context);

                if (propValue === undefined) {
                    throw Error(`invalid reference ${match}`);
                }

                if (match === value) {
                    newValue = propValue;
                } else if (typeof propValue === "string") {
                    newValue = newValue.replace(match, propValue);
                } else {
                    throw Error(`the referenced substring is not a string`);
                }
            }
            this.update(newValue);
        }
    });

    return resolvedObject;
};

const validateGraph = graph => {
    const isAcyclic = alg.isAcyclic(graph);
    if (!isAcyclic) {
        const cycles = alg.findCycles(graph);
        let msg = ["Your template has circular dependencies:"];
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

const getTemplate = async inputs => {
    const template = inputs.template || {};

    if (typeof template === "string") {
        if (
            (!utils.isJsonPath(template) && !utils.isYamlPath(template)) ||
            !(await utils.fileExists(template))
        ) {
            throw Error("the referenced template path does not exist");
        }

        return utils.readFile(template);
    } else if (typeof template !== "object") {
        throw Error(
            "the template input could either be an object, or a string path to a template file"
        );
    }
    return template;
};

const resolveTemplate = (inputs, template) => {
    const regex = /\${(\w*:?[\w\d.-]+)}/g;
    let variableResolved = false;
    const resolvedTemplate = traverse(template).forEach(function(value) {
        const matches = typeof value === "string" ? value.match(regex) : null;
        if (matches) {
            let newValue = value;
            for (const match of matches) {
                // If ${cli.env} was matched, `propPath` will be ['cli', 'env']
                const propPath = match.substring(2, match.length - 1).split(".");
                const topLevelProp = propPath[0];
                if (/\${env\.(\w*:?[\w\d.-]+)}/g.test(match)) {
                    // This block handles references to `env` variables
                    newValue = process.env[propPath[1]];
                    variableResolved = true;
                } else if (/\${cli\.(\w*:?[\w\d.-]+)}/g.test(match)) {
                    // This block handles handles references to CLI parameters (--env, etc.)
                    newValue = value.replace(match, inputs[propPath[1]]);
                    variableResolved = true;
                } else {
                    // This block handles references to component output
                    if (!template[topLevelProp]) {
                        throw Error(`invalid reference ${match}`);
                    }

                    if (!template[topLevelProp].component) {
                        variableResolved = true;
                        const propValue = path(propPath, template);

                        if (propValue === undefined) {
                            throw Error(`invalid reference ${match}`);
                        }

                        if (match === value) {
                            newValue = propValue;
                        } else if (typeof propValue === "string") {
                            newValue = newValue.replace(match, propValue);
                        } else {
                            throw Error(`the referenced substring is not a string`);
                        }
                    }
                }
            }
            this.update(newValue);
        }
    });
    if (variableResolved) {
        return resolveTemplate(inputs, resolvedTemplate);
    }
    return resolvedTemplate;
};

const getAllComponents = (obj = {}) => {
    const allComponents = {};
    const options = { paths: [process.cwd()] };

    for (const key in obj) {
        if (obj[key] && obj[key].component) {
            let componentPath = obj[key].component;
            if (componentPath.startsWith(".")) {
                componentPath = join(process.cwd(), componentPath);
            }

            const resolvedPath = require.resolve(componentPath, options);

            allComponents[key] = {
                path: resolvedPath,
                inputs: obj[key].inputs || {}
            };
        }
    }

    return allComponents;
};

const setDependencies = allComponents => {
    const regex = /\${(\w*:?[\w\d.-]+)}/g;

    for (const alias in allComponents) {
        const dependencies = traverse(allComponents[alias].inputs).reduce(function(accum, value) {
            const matches = typeof value === "string" ? value.match(regex) : null;
            if (matches) {
                for (const match of matches) {
                    const referencedComponent = match.substring(2, match.length - 1).split(".")[0];

                    if (!allComponents[referencedComponent]) {
                        throw Error(
                            `the referenced component in expression ${match} does not exist`
                        );
                    }

                    if (!accum.includes(referencedComponent)) {
                        accum.push(referencedComponent);
                    }
                }
            }
            return accum;
        }, []);

        allComponents[alias].dependencies = dependencies;
    }

    return allComponents;
};

const createGraph = allComponents => {
    const graph = new Graph();

    for (const alias in allComponents) {
        graph.setNode(alias, allComponents[alias]);
    }

    for (const alias in allComponents) {
        const { dependencies } = allComponents[alias];
        if (!isEmpty(dependencies)) {
            for (const dependency of dependencies) {
                graph.setEdge(alias, dependency);
            }
        }
    }

    validateGraph(graph);

    return graph;
};

const executeGraph = async (allComponents, graph, instance) => {
    const leaves = graph.sinks();
    const templateDebug = instance.context.instance.debug;

    if (isEmpty(leaves)) {
        return allComponents;
    }

    for (const alias of leaves) {
        const componentData = graph.node(alias);
        const component = await instance.load(componentData.path, alias);
        component.context.instance.debug = debug(`webiny:${alias}`);
        const availableOutputs = getOutputs(allComponents);
        const inputs = resolveObject(allComponents[alias].inputs, availableOutputs);
        instance.context.status("Deploying", alias);
        try {
            allComponents[alias].outputs = (await component(inputs)) || {};
            instance.context.instance.debug = templateDebug;
            await trackComponent({ context: instance.context, component: componentData.path });
        } catch (err) {
            instance.context.log(`An error occurred during deployment of ${red(alias)}`);
            console.log();
            console.log(red(err));
            console.log();
            process.exit(1);
        }

        graph.removeNode(alias);
    }

    return executeGraph(allComponents, graph, instance);
};

const syncState = async (allComponents, instance) => {
    const templateDebug = instance.context.instance.debug;

    for (const alias in instance.state.components || {}) {
        if (!allComponents[alias]) {
            try {
                const component = await instance.load(instance.state.components[alias], alias);
                component.context.instance.debug = debug(`webiny:${alias}`);
                instance.context.status("Removing", alias);
                await component.remove();
                instance.context.instance.debug = templateDebug;
                trackComponent({
                    context: instance.context,
                    component: instance.state.components[alias],
                    method: "remove"
                });
            } catch (e) {
                instance.context.log(`An error occurred while removing ${alias}: ${e.stack}`);
            }
        }
    }

    instance.state.components = {};

    for (const alias in allComponents) {
        instance.state.components[alias] = allComponents[alias].path;
    }

    await instance.save();
};

module.exports = {
    getTemplate,
    resolveTemplate,
    getAllComponents,
    setDependencies,
    createGraph,
    executeGraph,
    syncState,
    getOutputs
};
