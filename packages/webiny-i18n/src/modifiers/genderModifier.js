export default {
    name: "gender",
    execute(value, parameters) {
        return value === "male" ? parameters[0] : parameters[1];
    }
};
