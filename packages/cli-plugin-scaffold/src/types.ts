import { Answers, QuestionCollection } from "inquirer";
import { ContextInterface } from "@webiny/handler/types";
import { Plugin } from "@webiny/plugins/types";
import { Ora } from "ora";

/**
 * Arguments for CliPlugin.create
 *
 * @category Cli
 */
export interface CliCommandPluginArgs {
    yargs: any;
    context: ContextInterface;
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
interface CliCommandScaffoldQuestionsCallableArgs {
    context: ContextInterface;
}

/**
 * A function that can be defined to build scaffold questions.
 *
 * @category Scaffold
 * @category ScaffoldQuestions
 * @category Template
 */
type CliCommandScaffoldQuestionsCallable<T> = (
    args: CliCommandScaffoldQuestionsCallableArgs
) => QuestionCollection<T>;

/**
 * CliCommandScaffold generate and onSuccess arguments.
 *
 * @category Scaffold
 * @category Template
 */
interface CliCommandScaffoldCallableArgs {
    input: {
        [key: string]: any;
    };
    context: ContextInterface;
    wait: (ms?: number) => Promise<void>;
    oraSpinner: Ora;
}

/**
 * CliCommandScaffold onError arguments.
 *
 * @category Scaffold
 * @category Template
 */
interface CliCommandScaffoldCallableWithErrorArgs extends CliCommandScaffoldCallableArgs {
    error: Error;
}

/**
 * Internal scaffold definition.
 *
 * @category Scaffold
 * @category Template
 */
interface CliCommandScaffold<T extends Answers> {
    /**
     * Name of the scaffold to be picked from list of choices.
     */
    name: string;
    /**
     * Definition of questions for users to go through when they run the scaffold.
     */
    questions: QuestionCollection<T> | CliCommandScaffoldQuestionsCallable<T>;
    /**
     * Generator ran after all the scaffold questions are completed.
     */
    generate: (args: CliCommandScaffoldCallableArgs) => Promise<any>;
    /**
     * Trigger when generator completes.
     */
    onSuccess: (args: CliCommandScaffoldCallableArgs) => void;
    /**
     * Trigger when there is a generator error.
     */
    onError?: (args: CliCommandScaffoldCallableWithErrorArgs) => Promise<void>;
}

/**
 * A plugin type for template scaffolds.
 *
 * @category Cli
 * @category Scaffold
 * @category Template
 */
export interface CliCommandScaffoldTemplate<T extends Answers = Answers> extends Plugin {
    /**
     * A type of the plugin.
     */
    type: "cli-plugin-scaffold-template";
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
    workspaces: {
        packages: string[];
    };
}

/**
 * A representation of loaded tsconfig.json and tsconfig.build.json files.
 * Used as T when reading a file with load-json-file.
 *
 * @category Scaffold
 * @category Template
 */
export interface TsConfigJson {
    extends: string;
}
