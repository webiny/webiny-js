import { createTaskDefinition } from "@webiny/tasks";
import { Context } from "../types";
import { ITaskResponseContinueOptions } from "@webiny/tasks/response/abstractions";

const MAX_RUNS = 5;

const getMaxRuns = (input?: string | number) => {
    const value = Number(input);
    if (isNaN(value)) {
        return MAX_RUNS;
    }
    return value > 0 && value < 50 ? value : MAX_RUNS;
};

interface TaskValues {
    run?: number;
    maxRuns?: string | number;
    seconds?: number | string;
}

const getOptions = (values: TaskValues): ITaskResponseContinueOptions | undefined => {
    if (!values.seconds || typeof values.seconds !== "number" || values.seconds < 1) {
        return undefined;
    }
    return {
        seconds: values.seconds
    };
};

export const createContinuingTask = () => {
    return createTaskDefinition<Context, TaskValues>({
        id: "continuingTask",
        title: "Mock Continuing Task",
        description:
            "This is a mock task which will continue to run until it reaches the defined run limit.",
        async run(params) {
            const { response, isAborted, input } = params;
            const run = input.run || 0;
            const maxRuns = getMaxRuns(input.maxRuns);
            if (run >= maxRuns) {
                return response.done("Got to the run limit.");
            }
            if (isAborted()) {
                return response.aborted();
            }

            await new Promise(resolve => setTimeout(resolve, 10000));

            return response.continue(
                {
                    ...(input || {}),
                    run: run + 1
                },
                getOptions(input)
            );
        }
    });
};
