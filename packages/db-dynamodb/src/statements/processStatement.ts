import allOperators from "./../operators";

export default function processStatement({ args, query }) {
    outerLoop: for (const [key, value] of Object.entries(query)) {
        const operators = Object.values(allOperators);
        for (let i = 0; i < operators.length; i++) {
            const operator = operators[i];
            if (operator.canProcess({ key, value, args })) {
                operator.process({ key, value, args, processStatement });
                continue outerLoop;
            }
        }
        throw new Error(`Invalid operator {${key} : ${value}}.`);
    }
}
