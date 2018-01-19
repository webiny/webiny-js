import {assert} from 'chai';
import User from './entities/user'
import {attributes} from 'webiny-model'

describe('getAttributes test', function () {
    it('should return all attribute', async () => {
        const user = new User();

        const allAttributes = user.getAttributes();

        assert.hasAllKeys(allAttributes, ['firstName', 'lastName', 'enabled', 'age', 'totalSomething', 'id']);
        assert.instanceOf(allAttributes['firstName'], attributes.char);
        assert.instanceOf(allAttributes['lastName'], attributes.char);
        assert.instanceOf(allAttributes['enabled'], attributes.boolean);
        assert.instanceOf(allAttributes['age'], attributes.integer);
        assert.instanceOf(allAttributes['totalSomething'], attributes.dynamic);
    });
});