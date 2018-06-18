// @flow
export default {
    name: "gender",
    execute(value: string, parameters: Array<string>) {
        return value === "male" ? parameters[0] : parameters[1];
    }
};
