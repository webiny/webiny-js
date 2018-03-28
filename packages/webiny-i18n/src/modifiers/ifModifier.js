export default {
    name: "if",
    execute(value, parameters) {
        return value === parameters[0] ? parameters[1] : parameters[2] || "";
    }
};
