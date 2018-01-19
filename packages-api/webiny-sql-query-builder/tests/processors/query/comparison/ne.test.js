import {assert} from 'chai';
import {operatorsProcessor} from './../../../../src/processors';

describe('regular and $ne equality comparison operator test', function () {
    it('should generate correct statement using $ne equality operator', () => {
        const output = operatorsProcessor.execute({firstName: {$ne: 'John'}});
        assert.equal(output, `(firstName <> 'John')`)
    });

    it('should generate IS NULL', () => {
        const output = operatorsProcessor.execute({deletedOn: {$ne: null}});
        assert.equal(output, `(deletedOn IS NOT NULL)`)
    });
});