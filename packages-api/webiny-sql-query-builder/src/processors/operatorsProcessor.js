// @flow
import SqlString from 'sqlstring';
import { logical, comparison } from './operators/query';

class OperatorsProcessor {
    operators: Array<Operator>;

    constructor() {
        this.operators = [
            logical.and,
            logical.or,
            comparison.eq,
            comparison.in,
            comparison.ne,
        ];
    }

    execute(payload: Payload): string {
        return this.process({ $and: payload });
    }

    process(payload: Payload): string {
        let output = '';

        outerLoop:
            for (const [key, value] of Object.entries(payload)) {
                for (let i = 0; i < this.operators.length; i++) {
                    const operator = this.operators[i];
                    if (operator.canProcess({ key, value, processor: this })) {
                        output += operator.process({ key, value, processor: this });
                        continue outerLoop;
                    }
                }
                throw new Error(`Invalid operator {${key} : ${(value: any)}}.`);
            }

        return output;
    }

    escape(value: any) {
        return SqlString.escape(value);
    }
}

export default OperatorsProcessor;