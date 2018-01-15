import {assert} from 'chai';
const User = require('./entities/user');
const {attributes} = require('webiny-model');

describe('getAttribute test', function () {
    it('should return attribute', async () => {
        const user = new User();
        assert.instanceOf(user.getAttribute('firstName'), attributes.char);
        assert.instanceOf(user.getAttribute('lastName'), attributes.char);
        assert.instanceOf(user.getAttribute('enabled'), attributes.boolean);
        assert.instanceOf(user.getAttribute('age'), attributes.integer);
    });

    it('should return undefined because attributes do not exist', async () => {
        const user = new User();
        assert.isUndefined(user.getAttribute('firstName____'), attributes.char);
        assert.isUndefined(user.getAttribute('lastName____'), attributes.char);
        assert.isUndefined(user.getAttribute('enabled____'), attributes.boolean);
        assert.isUndefined(user.getAttribute('age___'), attributes.integer);
    });
});