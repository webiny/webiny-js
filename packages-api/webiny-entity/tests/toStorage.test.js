import {assert} from 'chai';
const User = require('./entities/User');
const {Entity, Driver, EntityModel, EntityAttributesContainer} = require('./../src');
const {attributes} = require('webiny-model');

describe('toStorage test', function () {
    it('should return the same values, except dynamic attribute', async () => {
        const user = new User();
        user.populate({
            firstName: 'A',
            lastName: 'B',
            age: 10,
            enabled: true
        });
        await user.validate();

        const data = await user.toStorage();

        assert.hasAllKeys(data, ['id', 'firstName', 'lastName', 'enabled', 'age']);
        assert.strictEqual(data['firstName'], 'A');
        assert.strictEqual(data['lastName'], 'B');
        assert.strictEqual(data['enabled'], true);
        assert.strictEqual(data['age'], 10);
    });

    it('should return 1 or 0 instead true or false respectively', async () => {
        class CustomBooleanAttribute extends attributes.boolean {
            setStorageValue(value) {
                return this.setValue(!!value);
            }

            async getStorageValue() {
                return this.getValue() ? 1 : 0;
            }
        }

        class CustomAttributesContainer extends EntityAttributesContainer {
            boolean() {
                const model = this.getParentModel();
                model.setAttribute(this.name, new CustomBooleanAttribute(this.name, this));
                return model.getAttribute(this.name);
            }
        }

        class CustomDriverModel extends EntityModel {
            getAttributesContainerInstance() {
                return new CustomAttributesContainer(this);
            }
        }

        class CustomDriver extends Driver {
            onEntityConstruct(entity) {
                entity.model = new CustomDriverModel();
            }
        }

        class CustomEntity extends Entity {
            constructor() {
                super();
                this.attr('firstName').char();
                this.attr('lastName').char();
                this.attr('age').integer();
                this.attr('enabled').boolean();
                this.attr('totalSomething').dynamic(() => 555);
            }
        }

        CustomEntity.driver = new CustomDriver();
        CustomEntity.classId = 'customEntity';

        const custonEntity1 = new CustomEntity();
        custonEntity1.populate({
            firstName: 'A',
            lastName: 'B',
            age: 10,
            enabled: true
        });
        await custonEntity1.validate();

        const data1 = await custonEntity1.toStorage();

        assert.hasAllKeys(data1, ['id', 'firstName', 'lastName', 'enabled', 'age']);
        assert.strictEqual(data1['firstName'], 'A');
        assert.strictEqual(data1['lastName'], 'B');
        assert.strictEqual(data1['enabled'], 1);
        assert.strictEqual(data1['age'], 10);

        const customEntity2 = new CustomEntity();
        customEntity2.populate({
            firstName: 'A',
            lastName: 'B',
            age: 10,
            enabled: false
        });
        await customEntity2.validate();

        const data2 = await customEntity2.toStorage();

        assert.hasAllKeys(data2, ['id', 'firstName', 'lastName', 'enabled', 'age']);
        assert.strictEqual(data2['firstName'], 'A');
        assert.strictEqual(data2['lastName'], 'B');
        assert.strictEqual(data2['enabled'], 0);
        assert.strictEqual(data2['age'], 10);
    });
});