import {assert} from 'chai';

import {Entity} from './../src'

class Invoice extends Entity {
	constructor() {
		super();
		this.attr('company').entity(Company);
		this.attr('isPaid').boolean();
		this.attr('beforeSaveCalled').integer();
		this.attr('afterSaveCalled').integer();

		this.on('beforeSave', () => {
			this.beforeSaveCalled++;
		}).setOnce();

		this.on('afterSave', () => {
			this.afterSaveCalled++;
		});
	}

	async setPaid(price) {
		this.isPaid = true;
		await this.emit('paid', {price});
		return this;
	}
}

class Company extends Entity {
	constructor() {
		super();
		this.attr('name').char().setValidators('required');
		this.attr('invoicesPaidCount').integer().setDefaultValue(0);
		this.attr('invoicesPaidAmount').integer().setDefaultValue(0);
	}
}

Invoice.on('paid', async ({entity, price}) => {
	const company = await entity.company;
	company.invoicesPaidCount++;
	company.invoicesPaidAmount += price;
});

describe('events test', function () {
	it('should register and execute static and instance event handlers', async () => {
		const company1 = new Company();
		company1.name = 'Company';
		const invoice1 = new Invoice();
		invoice1.company = company1;
		await invoice1.setPaid(100);
		await invoice1.save();

		assert.equal(company1.invoicesPaidCount, 1);
		assert.equal(company1.invoicesPaidAmount, 100);
		assert.equal(invoice1.afterSaveCalled, 1);
		assert.equal(invoice1.beforeSaveCalled, 1);

		const company2 = new Company();
		company2.name = 'Company';
		const invoice2 = new Invoice();
		invoice2.company = company2;
		await await invoice2.setPaid(200);
		await invoice2.save();

		assert.equal(company1.invoicesPaidCount, 1);
		assert.equal(company1.invoicesPaidAmount, 100);
		assert.equal(company2.invoicesPaidCount, 1);
		assert.equal(company2.invoicesPaidAmount, 200);

		assert.equal(invoice2.afterSaveCalled, 1);
		assert.equal(invoice2.beforeSaveCalled, 1);

		const company3 = new Company();
		company3.name = 'Company';
		const invoice3 = new Invoice();
		invoice3.company = company3;
		await await invoice3.setPaid(300);
		await invoice3.save();

		assert.equal(company1.invoicesPaidCount, 1);
		assert.equal(company1.invoicesPaidAmount, 100);
		assert.equal(company2.invoicesPaidCount, 1);
		assert.equal(company2.invoicesPaidAmount, 200);
		assert.equal(company3.invoicesPaidCount, 1);
		assert.equal(company3.invoicesPaidAmount, 300);
		assert.equal(invoice3.afterSaveCalled, 1);
		assert.equal(invoice3.beforeSaveCalled, 1);

		const invoice4 = new Invoice();
		invoice4.company = company1;
		await invoice4.setPaid(400);
		await invoice4.save();

		assert.equal(company1.invoicesPaidCount, 2);
		assert.equal(company1.invoicesPaidAmount, 500);
		assert.equal(company2.invoicesPaidCount, 1);
		assert.equal(company2.invoicesPaidAmount, 200);
		assert.equal(company3.invoicesPaidCount, 1);
		assert.equal(company3.invoicesPaidAmount, 300);
		assert.equal(invoice4.afterSaveCalled, 1);
		assert.equal(invoice4.beforeSaveCalled, 1);

		const invoice5 = new Invoice();
		invoice5.company = company2;
		await invoice5.setPaid(100);
		await invoice5.save();

		assert.equal(company1.invoicesPaidCount, 2);
		assert.equal(company1.invoicesPaidAmount, 500);
		assert.equal(company2.invoicesPaidCount, 2);
		assert.equal(company2.invoicesPaidAmount, 300);
		assert.equal(company3.invoicesPaidCount, 1);
		assert.equal(company3.invoicesPaidAmount, 300);
		assert.equal(invoice5.afterSaveCalled, 1);
		assert.equal(invoice5.beforeSaveCalled, 1);

		const invoice6 = new Invoice();
		invoice6.company = company3;
		await invoice6.setPaid(700);
		await invoice6.save();

		assert.equal(company1.invoicesPaidCount, 2);
		assert.equal(company1.invoicesPaidAmount, 500);
		assert.equal(company2.invoicesPaidCount, 2);
		assert.equal(company2.invoicesPaidAmount, 300);
		assert.equal(company3.invoicesPaidCount, 2);
		assert.equal(company3.invoicesPaidAmount, 1000);
		assert.equal(invoice6.afterSaveCalled, 1);
		assert.equal(invoice6.beforeSaveCalled, 1);
	});

	it('event handler should be triggered only once', async () => {
		const invoice1 = new Invoice();
		await invoice1.save();
		await invoice1.save();
		await invoice1.save();
		await invoice1.save();

		assert.equal(invoice1.beforeSaveCalled, 1);
		assert.equal(invoice1.afterSaveCalled, 4);
	});
});