const operators = require('./operators');
const SqlString = require('sqlstring');

class OperatorsProcessor {
    constructor() {
        this.processors = [
            operators.query.logical.and,
            operators.query.logical.or,

            operators.query.comparison.eq,
            operators.query.comparison.in,
            operators.query.comparison.ne,
        ];
    }

    execute(payload) {
        return this.process({$and: payload});
    }

    process(payload) {
        let output = '';

        outerLoop:
            for (const [key, value] of Object.entries(payload)) {
                const current = {key: null, value: null};
                current.key = key;
                current.value = value;
                for (let i = 0; i < this.processors.length; i++) {
                    current.operator = this.processors[i];
                    if (current.operator.canProcess({key, value, processor: this})) {
                        output += current.operator.process({key, value, processor: this});
                        continue outerLoop;
                    }
                }
                throw Error(`Invalid operator {${current.key} : ${current.value}}.`);
            }

        return output;
    }

    escape(value) {
        return SqlString.escape(value);
    }
}

module.exports = new OperatorsProcessor();