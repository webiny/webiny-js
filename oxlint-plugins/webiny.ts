/**
 * Webiny-specific oxlint rules.
 *
 * 1. no-inline-class-in-create-implementation
 *    Forbids inline `class` expressions passed to `createImplementation(...)`.
 *    Bad:  createImplementation({ implementation: class Foo { ... } })
 *    Good: class Foo { ... }
 *          createImplementation({ implementation: Foo })
 *
 * 2. require-implements-on-create-implementation
 *    The class passed to `X.createImplementation({ implementation: Foo })` must
 *    declare an `implements` clause (either `X.Interface` or the raw interface,
 *    e.g. `IEventType<T>`).
 *    Bad:  class Foo { ... }
 *          EventType.createImplementation({ implementation: Foo })
 *    Good: class Foo implements EventType.Interface { ... }
 *          EventType.createImplementation({ implementation: Foo })
 *
 *    AST-only (no type info): matches the class declaration by name within the
 *    same file and checks that *some* `implements` clause is present — it cannot
 *    verify the interface is the correct one (structural typing, generics, and
 *    `X.Interface` vs `IX<T>` aliases make that infeasible without type info).
 *    Imported classes (declaration not visible in the file) are skipped.
 */

function isCreateImplementationCallee(callee: any): boolean {
    if (callee?.type === "Identifier" && callee.name === "createImplementation") {
        return true;
    }
    if (
        callee?.type === "MemberExpression" &&
        callee.property?.type === "Identifier" &&
        callee.property.name === "createImplementation"
    ) {
        return true;
    }
    return false;
}

// Turn an Identifier / MemberExpression into a dotted name string, or null.
function exprToName(node: any): string | null {
    if (!node) {
        return null;
    }
    if (node.type === "Identifier") {
        return node.name;
    }
    if (node.type === "MemberExpression" && node.property?.type === "Identifier") {
        const object = exprToName(node.object);
        return object ? `${object}.${node.property.name}` : null;
    }
    return null;
}

// The object the method is called on: `EventType` in `EventType.createImplementation(...)`.
function calleeObjectName(callee: any): string | null {
    if (callee?.type === "MemberExpression") {
        return exprToName(callee.object);
    }
    return null;
}

// Extract `implementation:` identifier name from the first argument object, or null.
function implementationArgName(node: any): string | null {
    const firstArg = node.arguments?.[0];
    if (firstArg?.type !== "ObjectExpression") {
        return null;
    }
    for (const prop of firstArg.properties) {
        if (
            prop.type === "Property" &&
            prop.key?.type === "Identifier" &&
            prop.key.name === "implementation"
        ) {
            return prop.value?.type === "Identifier" ? prop.value.name : null;
        }
    }
    return null;
}

function classImplementsNames(node: any): string[] {
    const clauses = node.implements ?? [];
    return clauses
        .map((clause: any) => exprToName(clause.expression))
        .filter((name: string | null): name is string => name !== null);
}

const noInlineClass = {
    meta: {
        type: "problem",
        docs: { description: "Disallow inline class expressions inside createImplementation()" },
        messages: {
            inlineClass:
                "Do not define a class inline inside createImplementation(). Declare the class separately and pass it by reference."
        },
        schema: []
    },
    create(context: any) {
        return {
            ClassExpression(node: any) {
                const ancestors =
                    typeof context.sourceCode?.getAncestors === "function"
                        ? context.sourceCode.getAncestors(node)
                        : [];
                for (const ancestor of ancestors) {
                    if (
                        ancestor?.type === "CallExpression" &&
                        isCreateImplementationCallee(ancestor.callee)
                    ) {
                        context.report({ node, messageId: "inlineClass" });
                        return;
                    }
                }
            }
        };
    }
};

const requireImplements = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Require the class passed to X.createImplementation() to declare `implements X.Interface`"
        },
        messages: {
            missingImplements:
                "Class '{{className}}' passed to {{object}}.createImplementation() must declare an `implements` clause (e.g. `implements {{object}}.Interface` or the raw interface)."
        },
        schema: []
    },
    create(context: any) {
        // className -> { class node, its `implements` names }, collected across the file.
        const classes = new Map<string, { node: any; implemented: string[] }>();
        // Deferred checks collected at call sites.
        const pending: Array<{ className: string; object: string }> = [];

        function recordClass(node: any) {
            if (node.id?.type === "Identifier") {
                classes.set(node.id.name, { node, implemented: classImplementsNames(node) });
            }
        }

        return {
            ClassDeclaration: recordClass,
            ClassExpression: recordClass,
            CallExpression(node: any) {
                if (!isCreateImplementationCallee(node.callee)) {
                    return;
                }
                const object = calleeObjectName(node.callee);
                const className = implementationArgName(node);
                // Skip non-`X.method()` calls or non-identifier implementations.
                if (!object || !className) {
                    return;
                }
                pending.push({ className, object });
            },
            "Program:exit"() {
                for (const { className, object } of pending) {
                    const entry = classes.get(className);
                    // Class declaration not found in this file (imported) — cannot check.
                    if (entry === undefined) {
                        continue;
                    }
                    // AST-only: we can't verify the interface is the *right* one
                    // (structural typing, generics, `X.Interface` vs `IX<T>` aliases).
                    // Enforce only that the class declares *an* interface. Report on the
                    // class declaration so a disable directive sits above the class.
                    if (entry.implemented.length === 0) {
                        context.report({
                            node: entry.node,
                            messageId: "missingImplements",
                            data: { className, object }
                        });
                    }
                }
            }
        };
    }
};

const plugin = {
    meta: { name: "webiny" },
    rules: {
        "no-inline-class-in-create-implementation": noInlineClass,
        "require-implements-on-create-implementation": requireImplements
    }
};

export default plugin;
