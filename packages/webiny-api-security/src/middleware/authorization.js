// @flow
import Permission from "./../entities/permission.entity";

export default () => {
    /**
     * Authorization middleware.
     * Checks if request identity is authorized to execute the matched API method.
     *
     * @param {Api} params.app
     * @param next
     */
    return async (params, next: Function) => {
        const identity = params.req.identity;

        let scope = {};
        if (identity) {
            // Scope received from identity already possesses 'anonymous' permission's scope.
            scope = await identity.scope;
        } else {
            const anonymousPermission = await Permission.findOne({ query: { slug: "anonymous" } });
            for (let operationName in anonymousPermission.scope) {
                if (!scope[operationName]) {
                    scope[operationName] = [];
                }
                scope[operationName].push(anonymousPermission.scope[operationName]);
            }
        }

        for (let i = 0; i < params.graphql.documentAST.definitions.length; i++) {
            let operation = params.graphql.documentAST.definitions[i];
            const name = operation.selectionSet.selections[0].name.value;

            if (!scope[name]) {
                throw Error(`Not authorized to access "${name}" operation.`);
            }

            let hasAccess = false;
            scope[name].forEach(item => {
                if (item === true || item instanceof Object) {
                    hasAccess = true;
                    return false;
                }
            });

            if (!hasAccess) {
                throw Error(`Not authorized to access "${name}" operation.`);
            }
        }

        next();
    };
};
