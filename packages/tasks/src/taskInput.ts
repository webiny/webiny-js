export interface TaskInputParams<T> {
    type: string;
    input: T;
}
class TaskInput<T> {
    public type: string;
    public input: T;

    constructor(params: TaskInputParams<T>) {
        this.type = params.type;
        this.input = params.input;
    }
}

export type { TaskInput };

interface Params<T> {
    type: string;
    input: T;
}

export const createTaskInput = <T>(params: Params<T>) => {
    return new TaskInput({
        type: params.type,
        input: params.input
    });
};
