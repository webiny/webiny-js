import { Modifier } from "~/types";

export default (): Modifier => {
    return {
        name: "gender",
        execute(value: string, parameters: Array<string>) {
            return value === "male" ? parameters[0] : parameters[1];
        }
    };
};
