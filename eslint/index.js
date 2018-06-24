// @flowIgnore
module.exports = {
    rules: {
        "flow-required": {
            create: function(context) {
                return {
                    Program(node) {
                        const comments = node.comments || [];
                        if (comments[0]) {
                            const firstComment = node.comments[0].value.trim();
                            if (firstComment === "@flow" || firstComment === "@flowIgnore") {
                                return;
                            }
                        }

                        context.report(
                            node,
                            'Flow missing - add "// @flow" or "// @flowIgnore" comment on top of the file.'
                        );
                    }
                };
            }
        }
    }
};
