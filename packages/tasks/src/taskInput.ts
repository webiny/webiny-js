export interface ITaskInputParams<T> {
    id: string;
    input: T;
}
class TaskInput<T> {
    public id: string;
    public input: T;

    constructor(params: ITaskInputParams<T>) {
        this.id = params.id;
        this.input = params.input;
    }
}

export type { TaskInput };

interface ICreateTaskInputParams<T> {
    id: string;
    input: T;
}

export const createTaskInput = <T>(params: ICreateTaskInputParams<T>) => {
    return new TaskInput({
        id: params.id,
        input: params.input
    });
};
