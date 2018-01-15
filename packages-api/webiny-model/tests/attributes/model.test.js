import {assert} from 'chai';
const Model = require('./../../src/model');
const ModelError = require('./../../src/modelError');
const {User} = require('./../models/userModels');

describe('attribute model test', function () {
	describe('accepting correct Model classes test', () => {
		class Model1 extends Model {
		}

		class Model2 extends Model {
		}

		const model = new Model(function () {
			this.attr('attribute1').model(Model1);
			this.attr('attribute2').model(Model2);
		});

		it('attribute1 should accept Model1', async () => {
			model.attribute1 = new Model1();
			assert.instanceOf(model.attribute1, Model1);
			try {
			    await model.validate();
            } catch (e) {
                throw Error('Error should not have been thrown.');
            }
        });

		it('attribute2 should accept Model2', async () => {
            model.attribute2 = new Model2();
            assert.isObject(model.attribute2);
            assert.instanceOf(model.attribute2, Model2);
            try {
                await model.validate();
            } catch (e) {
                throw Error('Error should not have been thrown.');
            }
		});

		it('attribute1 shouldn\'t accept Model2 (ModelError must be thrown)', async () => {
			let error = null;
			try {
				model.attribute1 = new Model2();
				await model.validate();
			} catch (e) {
				error = e;
			}

			assert.instanceOf(error, ModelError);
			assert.equal(error.getType(), ModelError.INVALID_ATTRIBUTES);

		});

		it('attribute2 shouldn\'t accept Model1 (ModelError must be thrown', async () => {
			let error = null;
			try {
				model.attribute2 = new Model1();
				await model.validate();
			} catch (e) {
				error = e;
			}

			assert.instanceOf(error, ModelError);
			assert.equal(error.getType(), ModelError.INVALID_ATTRIBUTES);
		});
	});

	describe('setting nested values to model and all nested models test', () => {
		it('should correctly populate', async () => {
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

			assert.equal(user.firstName, 'John');
			assert.equal(user.lastName, 'Doe');
			assert.equal(user.age, 15);
			assert.equal(user.company.name, 'Webiny LTD');
			assert.equal(user.company.city, 'London');

			assert.equal(user.company.image.file, 'webiny.jpg');
			assert.equal(user.company.image.visible, false);
			assert.equal(user.company.image.size.width, 12.5);
			assert.equal(user.company.image.size.height, 44);

		});

		it('should trigger validation error on image size (missing width)', async () => {
			const user = new User();

			let error, validator = null;
			try {
				user.populate({
					firstName: 'John',
					lastName: 'Doe',
					age: 15,
					company: {
						name: 'Webiny LTD',
						city: 'London',
						image: {
							file: 'webiny.jpg',
							size: {width: 12.5},
							visible: false
						}
					}
				});
				await user.validate();
			} catch (e) {
				error = e;
				validator = e.data.invalidAttributes.company.data.invalidAttributes.image.data.invalidAttributes.size.data.invalidAttributes.height.data.validator;
			}

			assert.instanceOf(error, ModelError);
			assert.equal(validator, 'required');

		});
	});

    describe('getting values out of model test', () => {
        const user = new User();
        user.populate({
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

        it('when accessed directly, it should return a plain object with data', async () => {
            assert.isObject(user.company);
            assert.isObject(user.company.image);
            assert.isObject(user.company.image.size);
        });

        it('when accessing nested key directly, it should return its value', async () => {
            assert.equal(user.company.name, 'Webiny LTD');
            assert.equal(user.company.image.file, 'webiny.jpg');
            assert.equal(user.company.image.size.width, 12.5);

        });
    });
});