import { Plugin } from "@webiny/plugins/Plugin";
import { Question as BaseQuestion } from "inquirer";
import { PromptModule } from "inquirer";
import Choice from "inquirer/lib/objects/choice";
import { Ora } from "ora";
import { CliSeedContext, Logger } from "~/types";

export interface QuestionsParams {
    context: CliSeedContext;
}

export interface Question extends BaseQuestion {
    choices?: Choice[];
}

export type Questions = ((params: QuestionsParams) => Question[]) | Question[];

export type Answers = Record<string, any>;

export interface ProcessParams {
    context: CliSeedContext;
    answers: Answers;
    inquirer: PromptModule;
    ora: Ora;
    log: Logger;
}

export interface OnSuccessParams {
    context: CliSeedContext;
    answers: Answers;
    inquirer: PromptModule;
    ora: Ora;
    log: Logger;
}

export interface OnErrorParams {
    context: CliSeedContext;
    answers: Answers;
    error: Error;
    inquirer: PromptModule;
    ora: Ora;
    log: Logger;
}

export interface Params {
    id: string;
    name: string;
    questions: Questions;
    process: (app: CliCommandSeedApplication, params: ProcessParams) => Promise<void>;
    onSuccess?: (app: CliCommandSeedApplication, params: OnSuccessParams) => Promise<void>;
    onError?: (app: CliCommandSeedApplication, params: OnErrorParams) => Promise<void>;
}
export class CliCommandSeedApplication extends Plugin {
    public static readonly type: string = "cli-plugin-seed-application";

    private readonly params: Params;

    public constructor(params: Params) {
        super();
        this.params = params;
    }

    public getId(): string {
        return this.params.id;
    }

    public getName(): string {
        return this.params.name;
    }

    public getQuestions(params: QuestionsParams): Question[] {
        const questions =
            typeof this.params.questions === "function"
                ? this.params.questions(params)
                : this.params.questions;

        this.validateQuestions(questions);

        return questions;
    }

    public async process(params: ProcessParams): Promise<void> {
        return this.params.process(this, params);
    }

    public async onSuccess(params: OnSuccessParams): Promise<void> {
        if (!this.params.onSuccess) {
            params.log.green("Successfully generated records.");
            return;
        }
        return this.params.onSuccess(this, params);
    }

    public async onError(params: OnErrorParams): Promise<void> {
        if (!this.params.onError) {
            params.log.red(params.error.message);
            return;
        }
        return this.params.onError(this, params);
    }
    /**
     * Method validates question name attribute value.
     * We throw error here because it is an error that will appear during the development.
     */
    protected validateQuestions(questions: Question[]): void {
        const names: string[] = [];
        for (const index in questions) {
            const question = questions[index];
            if (!(question.name || "").trim()) {
                throw new Error(`Question in array position #${index} is missing "name" value.`);
            } else if (names.includes(question.name)) {
                throw new Error(`There are multiple questions with name "${question.name}".`);
            }
            names.push(question.name);
        }
    }
}
