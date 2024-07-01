import { QuestionCollection } from "inquirer";
import { CliContext } from "@webiny/cli/types";
import { Plugin } from "@webiny/plugins/types";
import { Ora } from "ora";
import inquirer from "inquirer";

/**
 * Arguments for CliPlugin.create
 *
 * @category Cli
 */
export interface CliCommandPluginArgs {
    yargs: any;
    context: CliContext;
}

/**
 * A plugin defining cli-command type.
 *
 * @category Plugin
 * @category Cli
 */
export interface CliCommandPlugin extends Plugin {
    type: "cli-command";
    name: string;
    create: (args: CliCommandPluginArgs) => void;
}

/**
 * Arguments for the CliCommandScaffoldQuestionsCallable.
 *
 * @category Scaffold
 * @category ScaffoldQuestions
 * @category Template
 */
export interface CliCommandScaffoldQuestionsCallableArgs {
    context: CliContext;
}

/**
 * A function that can be defined to build scaffold questions.
 *
 * @category Scaffold
 * @category ScaffoldQuestions
 * @category Template
 */
export type CliCommandScaffoldQuestionsCallable = (
    args: CliCommandScaffoldQuestionsCallableArgs
) => QuestionCollection;

/**
 * CliCommandScaffold generate and onSuccess arguments.
 *
 * @category Scaffold
 * @category Template
 */
export interface CliCommandScaffoldCallableArgs<T extends Record<string, any>> {
    input: T;
    context: CliContext;
    wait: (ms?: number) => Promise<void>;
    inquirer: typeof inquirer;
    ora: Ora;
}

/**
 * CliCommandScaffold onError arguments.
 *
 * @category Scaffold
 * @category Template
 */
export interface CliCommandScaffoldCallableWithErrorArgs<T extends Record<string, any>>
    extends CliCommandScaffoldCallableArgs<T> {
    error: Error;
}

/**
 * Internal scaffold definition.
 *
 * @category Scaffold
 * @category Template
 */
export interface CliCommandScaffold<T extends Record<string, any>> {
    /**
     * Name of the scaffold to be picked from list of choices.
     */
    name: string;
    /**
     * A short description of the scaffold.
     */
    description: string;
    /**
     * Definition of questions for users to go through when they run the scaffold.
     */
    questions: QuestionCollection | CliCommandScaffoldQuestionsCallable;
    /**
     * Generator ran after all the scaffold questions are completed.
     */
    generate: (args: CliCommandScaffoldCallableArgs<T>) => Promise<any>;
    /**
     * Trigger when generator is about to be executed (before its execution).
     */
    onGenerate?: (args: CliCommandScaffoldCallableArgs<T>) => Promise<void>;
    /**
     * Trigger when generator completes.
     */
    onSuccess?: (args: CliCommandScaffoldCallableArgs<T>) => Promise<void>;
    /**
     * Trigger when there is a generator error.
     */
    onError?: (args: CliCommandScaffoldCallableWithErrorArgs<T>) => Promise<void>;
}

/**
 * A plugin type for template scaffolds.
 *
 * @category Cli
 * @category Scaffold
 * @category Template
 */
export interface CliCommandScaffoldTemplate<T extends Record<string, any> = Record<string, any>>
    extends Plugin {
    /**
     * A type of the plugin.
     */
    type: "cli-plugin-scaffold-template";

    /**
     * Template name. Can be used when running the scaffold command in
     * non-interactive mode (for example: `webiny scaffold new-template`).
     */
    templateName?: string;

    /**
     * The scaffold definition.
     */
    scaffold: CliCommandScaffold<T>;
}

/**
 * A representation of loaded package.json file.
 * Used as T when reading a file with load-json-file.
 *
 * @category Scaffold
 * @category Template
 */
export interface PackageJson {
    name: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    peerDependencies: Record<string, string>;
    keywords?: string[];
    workspaces: {
        packages: string[];
    };
}

interface TsConfigJsonReference {
    path: string;
}

interface TsConfigJsonCompilerOptions {
    paths?: Record<string, string[]>;
}
/**
 * A representation of loaded tsconfig.json and tsconfig.build.json files.
 * Used as T when reading a file with load-json-file.
 *
 * @category Scaffold
 * @category Template
 */
export interface TsConfigJson {
    include?: string[];
    extends: string;
    references?: TsConfigJsonReference[];
    compilerOptions?: TsConfigJsonCompilerOptions;
}
