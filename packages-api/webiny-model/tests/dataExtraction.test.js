import {assert} from 'chai';

const {User} = require('./models/userModels');
const user = new User();
user.populate({
    firstName: 'John',
    lastName: 'Doe',
    age: 15,
    company: {
        name: 'Webiny LTD',
        city: 'London',
        image: {
            file: 'webiny.jpg',
            size: {width: 12.5, height: 44},
            visible: false
        }
    }
});

describe('data extraction test', async function () {
	it('should correctly extract root values', async () => {
		const data = await user.toJSON('firstName,lastName,age,company');
		assert.equal(data.firstName, 'John');
		assert.equal(data.lastName, 'Doe');
		assert.equal(data.age, 15);
		assert.equal(data.company.city, 'London');
	});

	it('should correctly extract nested values', async () => {
		const data = await user.toJSON('firstName,lastName,age,company[name,city,image.size[height]]');
		assert.equal(data.firstName, 'John');
		assert.equal(data.lastName, 'Doe');
		assert.equal(data.age, 15);
		assert.equal(data.company.name, 'Webiny LTD');
		assert.equal(data.company.city, 'London');
		assert.equal(data.company.image.size.height, 44);
	});

    it('when requesting attribute that is a model, its data should be returned completely extracted (all keys)', async () => {
        const data = await user.toJSON('firstName,lastName,age,company');
        assert.hasAllKeys(data, ['firstName', 'lastName', 'age', 'company']);

        assert.equal(data.firstName, 'John');
        assert.equal(data.lastName, 'Doe');
        assert.equal(data.age, 15);
        assert.isObject(data.company);
        assert.equal(data.company.name, 'Webiny LTD');
        assert.equal(data.company.city, 'London');
        assert.equal(data.company.image.size.height, 44);
    });

    it('should return whole JSON if no path is specified', async () => {
        const data = await user.toJSON();
        assert.hasAllKeys(data, ['firstName', 'lastName', 'age', 'company']);

        assert.equal(data.firstName, 'John');
        assert.equal(data.lastName, 'Doe');
        assert.equal(data.age, 15);
        assert.isObject(data.company);
        assert.equal(data.company.name, 'Webiny LTD');
        assert.equal(data.company.city, 'London');
        assert.equal(data.company.image.size.height, 44);
    });

});