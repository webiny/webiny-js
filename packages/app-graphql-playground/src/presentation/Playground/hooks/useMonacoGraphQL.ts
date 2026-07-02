import { useCallback, useEffect, useRef } from "react";
import type { BeforeMount, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { languages } from "monaco-editor";
import type { IntrospectionQuery } from "graphql";
import { buildClientSchema, GraphQLSchema } from "graphql";
import { getAutocompleteSuggestions, Position } from "graphql-language-service";
import type { IPlaygroundSchema } from "../abstractions.js";

/* Monarch tokenizer for basic GraphQL syntax highlighting. */
const graphqlTokensProvider: languages.IMonarchLanguage = {
    keywords: [
        "query",
        "mutation",
        "subscription",
        "fragment",
        "on",
        "type",
        "input",
        "enum",
        "scalar",
        "interface",
        "union",
        "extend",
        "implements",
        "directive",
        "schema",
        "true",
        "false",
        "null"
    ],

    tokenizer: {
        root: [
            /* Comments. */
            [/#.*$/, "comment"],

            /* Strings. */
            [/"([^"\\]|\\.)*"/, "string"],
            [/"""[\s\S]*?"""/, "string"],

            /* Numbers. */
            [/-?\d+(\.\d+)?([eE][+-]?\d+)?/, "number"],

            /* Variables. */
            [/\$\w+/, "variable"],

            /* Directives. */
            [/@\w+/, "annotation"],

            /* Keywords and identifiers. */
            [
                /[a-zA-Z_]\w*/,
                {
                    cases: {
                        "@keywords": "keyword",
                        "@default": "identifier"
                    }
                }
            ],

            /* Punctuation. */
            [/[{}()[\]:=!|&]/, "delimiter"],
            [/\.\.\./, "delimiter"],

            /* Whitespace. */
            [/\s+/, "white"]
        ]
    }
};

const graphqlLanguageConfig: languages.LanguageConfiguration = {
    comments: {
        lineComment: "#"
    },
    brackets: [
        ["{", "}"],
        ["(", ")"],
        ["[", "]"]
    ],
    autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "(", close: ")" },
        { open: "[", close: "]" },
        { open: '"', close: '"' }
    ],
    surroundingPairs: [
        { open: "{", close: "}" },
        { open: "(", close: ")" },
        { open: "[", close: "]" },
        { open: '"', close: '"' }
    ]
};

let languageRegistered = false;

interface UseMonacoGraphQLParams {
    onExecute: () => void;
    schema: IPlaygroundSchema | null;
}

export function useMonacoGraphQL(params: UseMonacoGraphQLParams) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const disposableRef = useRef<{ dispose(): void } | null>(null);
    const schemaRef = useRef<IPlaygroundSchema | null>(null);

    schemaRef.current = params.schema;

    const handleBeforeMount: BeforeMount = useCallback(monaco => {
        if (languageRegistered) {
            return;
        }

        monaco.languages.register({ id: "graphql" });
        monaco.languages.setMonarchTokensProvider("graphql", graphqlTokensProvider);
        monaco.languages.setLanguageConfiguration("graphql", graphqlLanguageConfig);
        languageRegistered = true;
    }, []);

    const handleEditorDidMount: OnMount = useCallback(
        (ed, monaco) => {
            editorRef.current = ed;

            ed.addAction({
                id: "execute-query",
                label: "Execute Query",
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                run: () => {
                    params.onExecute();
                }
            });
        },
        [params.onExecute]
    );

    /* Register or update the completion provider when the schema changes. */
    useEffect(() => {
        if (!params.schema) {
            return;
        }

        /* Dispose previous provider. */
        if (disposableRef.current) {
            disposableRef.current.dispose();
            disposableRef.current = null;
        }

        let graphqlSchema: GraphQLSchema;
        try {
            const introspection = { __schema: params.schema } as unknown as IntrospectionQuery;
            graphqlSchema = buildClientSchema(introspection);
        } catch {
            /* If schema is invalid, skip completion registration. */
            return;
        }

        /* Dynamic import of monaco to get the languages namespace. */
        const monacoInstance = (window as any).monaco;
        if (!monacoInstance) {
            return;
        }

        const disposable = monacoInstance.languages.registerCompletionItemProvider("graphql", {
            triggerCharacters: ["{", "(", ".", " ", ":", "@", "$"],
            provideCompletionItems(
                model: editor.ITextModel,
                position: { lineNumber: number; column: number }
            ) {
                const queryText = model.getValue();
                /* graphql-language-service uses 0-based lines and 0-based characters. */
                const cursor = new Position(position.lineNumber - 1, position.column - 1);

                const suggestions = getAutocompleteSuggestions(graphqlSchema, queryText, cursor);

                const word = model.getWordUntilPosition(position);

                return {
                    suggestions: suggestions.map(item => {
                        return {
                            label: item.label,
                            kind: monacoInstance.languages.CompletionItemKind.Field,
                            insertText: item.insertText || item.label,
                            detail: item.detail || "",
                            documentation: item.documentation || "",
                            range: {
                                startLineNumber: position.lineNumber,
                                startColumn: word.startColumn,
                                endLineNumber: position.lineNumber,
                                endColumn: word.endColumn
                            }
                        };
                    })
                };
            }
        });

        disposableRef.current = disposable;

        return () => {
            if (disposableRef.current) {
                disposableRef.current.dispose();
                disposableRef.current = null;
            }
        };
    }, [params.schema]);

    return {
        editorRef,
        handleBeforeMount,
        handleEditorDidMount
    };
}
