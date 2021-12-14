import { Plugin } from "@webiny/plugins";
import { Question } from "inquirer";
import {
    CliCommandSeedApplication,
    ProcessParams as BaseProcessParams,
    Questions,
    QuestionsParams
} from "~/plugins/CliCommandSeedApplication";
import { GraphQLClient } from "graphql-request";

export interface ProcessParams extends BaseProcessParams {
    application: CliCommandSeedApplication;
    client: GraphQLClient;
}
export interface Params {
    name: string;
    questions: Questions;
    recordType: string;
    process: (params: ProcessParams) => Promise<void>;
}

export class CliCommandSeedHeadlessCmsRecordType extends Plugin {
    public static readonly type: string = "cli-plugin-seed-application-headless-cms-record-type";

    private readonly params: Params;

    public constructor(params: Params) {
        super();
        this.params = params;
    }

    public getName(): string {
        return this.params.name;
    }

    public getRecordType(): string {
        return this.params.recordType;
    }

    public getQuestions(params: QuestionsParams): Question[] {
        const questions =
            typeof this.params.questions === "function"
                ? this.params.questions(params)
                : this.params.questions;
        return questions.map(question => {
            return {
                ...question,
                when: async answers => {
                    if (this.showQuestion(answers) === false) {
                        return false;
                    }
                    if (typeof question.when === "function") {
                        const result = await question.when(answers);
                        if (!result) {
                            return false;
                        }
                    }
                    return true;
                }
            };
        });
    }

    public async process(params: ProcessParams): Promise<void> {
        return this.params.process(params);
    }

    private showQuestion(answers: Record<string, any>): boolean {
        return answers.recordType === this.params.recordType;
    }
}
