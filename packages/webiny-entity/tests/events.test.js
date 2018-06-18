import { Entity } from "./../src";

class Invoice extends Entity {
    constructor() {
        super();
        this.attr("company").entity(Company);
        this.attr("isPaid").boolean();
        this.attr("beforeSaveCalled").integer();
        this.attr("afterSaveCalled").integer();

        this.on("beforeSave", () => {
            this.beforeSaveCalled++;
        }).setOnce();

        this.on("afterSave", () => {
            this.afterSaveCalled++;
        });
    }

    async setPaid(price) {
        this.isPaid = true;
        await this.emit("paid", { price });
        return this;
    }
}

Invoice.classId = "Invoice";

class Company extends Entity {
    constructor() {
        super();
        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("invoicesPaidCount")
            .integer()
            .setDefaultValue(0);
        this.attr("invoicesPaidAmount")
            .integer()
            .setDefaultValue(0);
    }
}

Company.classId = "Company";

Invoice.on("paid", async ({ entity, price }) => {
    const company = await entity.company;
    company.invoicesPaidCount++;
    company.invoicesPaidAmount += price;
});

describe("events test", () => {
    test("should register and execute static and instance event handlers", async () => {
        const company1 = new Company();
        company1.name = "Company";
        const invoice1 = new Invoice();
        invoice1.company = company1;
        await invoice1.setPaid(100);
        await invoice1.save();

        expect(company1.invoicesPaidCount).toEqual(1);
        expect(company1.invoicesPaidAmount).toEqual(100);
        expect(invoice1.afterSaveCalled).toEqual(1);
        expect(invoice1.beforeSaveCalled).toEqual(1);

        const company2 = new Company();
        company2.name = "Company";
        const invoice2 = new Invoice();
        invoice2.company = company2;
        await await invoice2.setPaid(200);
        await invoice2.save();

        expect(company1.invoicesPaidCount).toEqual(1);
        expect(company1.invoicesPaidAmount).toEqual(100);
        expect(company2.invoicesPaidCount).toEqual(1);
        expect(company2.invoicesPaidAmount).toEqual(200);

        expect(invoice2.afterSaveCalled).toEqual(1);
        expect(invoice2.beforeSaveCalled).toEqual(1);

        const company3 = new Company();
        company3.name = "Company";
        const invoice3 = new Invoice();
        invoice3.company = company3;
        await await invoice3.setPaid(300);
        await invoice3.save();

        expect(company1.invoicesPaidCount).toEqual(1);
        expect(company1.invoicesPaidAmount).toEqual(100);
        expect(company2.invoicesPaidCount).toEqual(1);
        expect(company2.invoicesPaidAmount).toEqual(200);
        expect(company3.invoicesPaidCount).toEqual(1);
        expect(company3.invoicesPaidAmount).toEqual(300);
        expect(invoice3.afterSaveCalled).toEqual(1);
        expect(invoice3.beforeSaveCalled).toEqual(1);

        const invoice4 = new Invoice();
        invoice4.company = company1;
        await invoice4.setPaid(400);
        await invoice4.save();

        expect(company1.invoicesPaidCount).toEqual(2);
        expect(company1.invoicesPaidAmount).toEqual(500);
        expect(company2.invoicesPaidCount).toEqual(1);
        expect(company2.invoicesPaidAmount).toEqual(200);
        expect(company3.invoicesPaidCount).toEqual(1);
        expect(company3.invoicesPaidAmount).toEqual(300);
        expect(invoice4.afterSaveCalled).toEqual(1);
        expect(invoice4.beforeSaveCalled).toEqual(1);

        const invoice5 = new Invoice();
        invoice5.company = company2;
        await invoice5.setPaid(100);
        await invoice5.save();

        expect(company1.invoicesPaidCount).toEqual(2);
        expect(company1.invoicesPaidAmount).toEqual(500);
        expect(company2.invoicesPaidCount).toEqual(2);
        expect(company2.invoicesPaidAmount).toEqual(300);
        expect(company3.invoicesPaidCount).toEqual(1);
        expect(company3.invoicesPaidAmount).toEqual(300);
        expect(invoice5.afterSaveCalled).toEqual(1);
        expect(invoice5.beforeSaveCalled).toEqual(1);

        const invoice6 = new Invoice();
        invoice6.company = company3;
        await invoice6.setPaid(700);
        await invoice6.save();

        expect(company1.invoicesPaidCount).toEqual(2);
        expect(company1.invoicesPaidAmount).toEqual(500);
        expect(company2.invoicesPaidCount).toEqual(2);
        expect(company2.invoicesPaidAmount).toEqual(300);
        expect(company3.invoicesPaidCount).toEqual(2);
        expect(company3.invoicesPaidAmount).toEqual(1000);
        expect(invoice6.afterSaveCalled).toEqual(1);
        expect(invoice6.beforeSaveCalled).toEqual(1);
    });

    test("event handler should be triggered only once", async () => {
        const invoice1 = new Invoice();
        await invoice1.save();
        expect(invoice1.beforeSaveCalled).toEqual(1);
        expect(invoice1.afterSaveCalled).toEqual(1);

        await invoice1.save();

        expect(invoice1.beforeSaveCalled).toEqual(1);
        expect(invoice1.afterSaveCalled).toEqual(2);

        await invoice1.save();
        await invoice1.save();

        expect(invoice1.beforeSaveCalled).toEqual(1);
        expect(invoice1.afterSaveCalled).toEqual(4);
    });

    test("should inherit static events from extended class", async () => {
        class FirstClass extends Entity {}
        class SecondClass extends FirstClass {}

        let counter = 0;

        FirstClass.on("someEvent", () => ++counter);
        await FirstClass.emit("someEvent");
        await FirstClass.emit("someEvent");
        await FirstClass.emit("someEvent");

        expect(counter).toEqual(3);

        await SecondClass.emit("someEvent");
        await SecondClass.emit("someEvent");
        await SecondClass.emit("someEvent");
        expect(counter).toEqual(6);

        SecondClass.on("someEvent", () => ++counter);
        await SecondClass.emit("someEvent");
        await SecondClass.emit("someEvent");
        await SecondClass.emit("someEvent");
        expect(counter).toEqual(12);
    });
});
