import {assert} from 'chai';
import {OperatorsProcessor} from './../../../../src/processors';
const operatorsProcessor = new OperatorsProcessor();

describe('$or logical operator test', function () {
    it('should generate correct statement with nested $or operators', () => {
        const output = operatorsProcessor.execute({firstName: 'John', lastName: 'Doe', $or: {age: 35, height: 6.2, weight: 225}});
        assert.equal(output, `(firstName = 'John' AND lastName = 'Doe' AND (age = 35 OR height = 6.2 OR weight = 225))`)
    });

    it('should generate correct statement with root $or operators', () => {
        const output = operatorsProcessor.execute({$or: {firstName: 'John', lastName: 'Doe'}});
        assert.equal(output, `((firstName = 'John' OR lastName = 'Doe'))`)
    });

    it('should generate correct statement root $or operators', () => {
        const output = operatorsProcessor.execute({$or: {firstName: 'John', lastName: 'Doe', $and: {age: 35, height: 6.2, weight: 225}}});
        assert.equal(output, `((firstName = 'John' OR lastName = 'Doe' OR (age = 35 AND height = 6.2 AND weight = 225)))`)
    });

    it('should throw Error because values are in invalid format', () => {
        try {
            operatorsProcessor.execute({
                $or: {
                    firstName: 'John',
                    lastName: 'Doe',
                    $or: '*** THIS IS AN INVALID FORMAT ***'
                }
            });
        } catch (e) {
            return;
        }

        throw Error(`Error should've been thrown.`);
    });

    it('should generate correct statement with nested $or operators but with values in an array', () => {
        const output = operatorsProcessor.execute({
            firstName: 'John',
            lastName: 'Doe',
            $or: [
                {age: 35},
                {age: 50},
                {height: 6.2, weight: 225}
            ]
        });

        assert.equal(output, `(firstName = 'John' AND lastName = 'Doe' AND (age = 35 OR age = 50 OR height = 6.2 OR weight = 225))`)
    });
});