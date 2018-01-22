import {assert} from 'chai';
import _ from 'lodash';

import {EventHandler, Entity} from './../src'

class EventsEntity extends Entity {

}

describe('event handler test', function () {
    const a = new EventsEntity();

    EventsEntity.on('onAfterUpdate', _.noop);
    EventsEntity.on('onAfterUpdate', _.noop);
    EventsEntity.on('onAfterUpdate', _.noop).setOnce();
    a.on('onAfterCreate', _.noop).setOnce();
    a.on('onAfterCreate', _.noop);

    it('should have one event handler registered', async () => {
        assert.hasAllKeys(a.listeners, ['delete', 'onAfterCreate']);
        assert.lengthOf(a.listeners.onAfterCreate, 2);
        assert.instanceOf(a.listeners.onAfterCreate[0], EventHandler);
		assert.instanceOf(a.listeners.onAfterCreate[1], EventHandler);

		assert.hasAllKeys(EventsEntity.listeners, ['onAfterUpdate']);
		assert.lengthOf(EventsEntity.listeners.onAfterUpdate, 3);
		assert.instanceOf(EventsEntity.listeners.onAfterUpdate[0], EventHandler);
		assert.instanceOf(EventsEntity.listeners.onAfterUpdate[1], EventHandler);
		assert.instanceOf(EventsEntity.listeners.onAfterUpdate[2], EventHandler);
    });

    it('should return callback by calling getCallback', async () => {
        assert.isFunction(a.listeners.onAfterCreate[0].getCallback());
        assert.isFunction(a.listeners.onAfterCreate[1].getCallback());
    });

    it('setOnce should return true because it was set', async () => {
        assert.isTrue(a.listeners.onAfterCreate[0].getOnce());
        assert.isFalse(a.listeners.onAfterCreate[1].getOnce());

		EventsEntity.on('onAfterUpdate', _.noop).setOnce();
		assert.lengthOf(EventsEntity.listeners.onAfterUpdate, 4);

		assert.isFalse(EventsEntity.listeners.onAfterUpdate[0].getOnce());
		assert.isFalse(EventsEntity.listeners.onAfterUpdate[1].getOnce());
		assert.isTrue(EventsEntity.listeners.onAfterUpdate[2].getOnce());
		assert.isTrue(EventsEntity.listeners.onAfterUpdate[3].getOnce());
	});
});