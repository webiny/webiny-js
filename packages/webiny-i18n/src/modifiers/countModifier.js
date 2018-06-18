// @flow
export default {
    name: "count",
    execute(value: string, parameters: Array<string>) {
        // Numbers can be single number or ranges.
        for (let i = 0; i < parameters.length; i = i + 2) {
            const current = parameters[i];
            if (current === "default") {
                return value + " " + parameters[i + 1];
            }

            const numbers = current.split("-");

            // If we are dealing with a numbers range, then let's check if we are in it.
            if (numbers.length === 2) {
                if (value >= numbers[0] && value <= numbers[1]) {
                    return value + " " + parameters[i + 1];
                }
                continue;
            }

            if (String(value) === numbers[0]) {
                return value + " " + parameters[i + 1];
            }
        }

        // If we didn't match any condition, let's just remove the received value.
        return value;
    }
};
