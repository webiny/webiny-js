const get = require("lodash.get");

module.exports = {
    rules: {
        namespaces: {
            create: function(context) {
                const rules = get(context, "options.0.rules", {});
                return {
                    VariableDeclarator(node) {
                        const oName = get(node, "init.callee.object.name");
                        const pName = get(node, "init.callee.property.name");
                        if (oName !== "i18n" || (pName !== "ns" && pName !== "namespace")) {
                            return;
                        }

                        const filename = context.getFilename();
                        const [namespace] = node.init.arguments;
                        if (!namespace || !namespace.value) {
                            const msg = `I18N namespace not specified.`;
                            context.report(node, msg);
                            return;
                        }

                        // eslint-disable-next-line
                        for (let rulesKey in rules) {
                            const regex = new RegExp(rulesKey);
                            if (filename.match(regex)) {
                                if (!namespace.value.match(rules[rulesKey])) {
                                    const msg = `Incorrect I18N namespace specified. Expected "${rules[rulesKey]}", received "${namespace.value}".`;
                                    context.report(namespace, msg);
                                    return;
                                }
                            }
                        }
                    }
                };
            }
        }
    }
};
