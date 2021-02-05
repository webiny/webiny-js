import { Answers, QuestionCollection } from "inquirer";
import { ContextInterface } from "@webiny/handler/types";
import { Plugin } from "@webiny/plugins/types";
import { Ora } from "ora";

export interface CliCommandPluginArgs {
    yargs: any;
    context: ContextInterface;
}

export interface CliCommandPlugin extends Plugin {
    type: "cli-command";
    name: string;
    create: (args: CliCommandPluginArgs) => void;
}

interface CliCommandScaffoldQuestionsCallableArgs {
    context: ContextInterface;
}

type CliCommandScaffoldQuestionsCallable<T> = (
    args: CliCommandScaffoldQuestionsCallableArgs
) => QuestionCollection<T>;

interface CliCommandScaffoldCallableArgs {
    input: {
        [key: string]: any;
    };
    context: ContextInterface;
    wait: (ms: number) => Promise<any>;
    oraSpinner: Ora;
}

interface CliCommandScaffoldCallableWithErrorArgs extends CliCommandScaffoldCallableArgs {
    error: Error;
}

interface CliCommandScaffold<T extends Answers> {
    name: string;
    questions: QuestionCollection<T> | CliCommandScaffoldQuestionsCallable<T>;
    generate: (args: CliCommandScaffoldCallableArgs) => Promise<any>;
    onSuccess: (args: CliCommandScaffoldCallableArgs) => Promise<void>;
    onError: (args: CliCommandScaffoldCallableWithErrorArgs) => Promise<void>;
}

export interface CliCommandScaffoldTemplate<T extends Answers = Answers> extends Plugin {
    type: "cli-plugin-scaffold-template";
    scaffold: CliCommandScaffold<T>;
}
