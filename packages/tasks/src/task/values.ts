export interface ITaskValuesParams<T> {
    id: string;
    values: T;
}
class TaskValues<T> {
    public id: string;
    public values: T;

    constructor(params: ITaskValuesParams<T>) {
        this.id = params.id;
        this.values = params.values;
    }
}

export type { TaskValues };

interface ICreateTaskValuesParams<T> {
    id: string;
    values: T;
}

export const createTaskValues = <T>(params: ICreateTaskValuesParams<T>) => {
    return new TaskValues({
        id: params.id,
        values: params.values
    });
};
