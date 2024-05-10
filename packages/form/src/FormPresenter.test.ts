import { validation } from "@webiny/validation";
import { FormPresenter } from "~/FormPresenter";
import { FormField } from "~/FormField";

const formData = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com"
};

describe("FormPresenter", () => {
    it("should initialize form with data", () => {
        const presenter = new FormPresenter();

        presenter.init({
            data: { ...formData }
        });

        const vm = presenter.vm;

        expect(vm.data).toEqual({ ...formData });

        expect(vm.invalidFields).toEqual({});
    });

    it("should register a field", async () => {
        const presenter = new FormPresenter();
        const beforeChangeSpy = jest.fn();
        const afterChangeSpy = jest.fn();

        presenter.init({
            data: {}
        });

        presenter.registerField({
            name: "firstName",
            validators: [validation.create("required")],
            beforeChange: async (value, cb) => {
                // Simulate an async callback
                await new Promise(resolve => setTimeout(resolve, 100));
                beforeChangeSpy(value);
                cb(value);
            },
            afterChange: value => {
                afterChangeSpy(value);
            }
        });

        presenter.registerField({
            name: "settings.email",
            validators: [validation.create("required,email")]
        });

        const vm = presenter.vm;

        // Assert
        expect(vm.formFields.get("firstName")).toBeInstanceOf(FormField);

        await presenter.setFieldValue("firstName", "John");
        await presenter.setFieldValue("settings.email", "test@example.com");

        expect(presenter.vm.data).toEqual({
            firstName: "John",
            settings: {
                email: "test@example.com"
            }
        });

        expect(beforeChangeSpy).toHaveBeenLastCalledWith("John");
        expect(afterChangeSpy).toHaveBeenLastCalledWith("John");

        await presenter.setFieldValue("settings.email", "not an email");
        const fieldValidation = await presenter.validateField("settings.email");
        expect(fieldValidation).toEqual({
            isValid: false,
            message: "Value must be a valid e-mail address."
        });
    });

    it("should validate a single field respecting skipped validators", async () => {
        const presenter = new FormPresenter();

        const withName = (cb: any, name: string) => {
            return Object.assign(cb, { validatorName: name });
        };

        presenter.init({
            data: {}
        });

        const fieldName = "settings.email";

        presenter.registerField({
            name: fieldName,
            validators: [
                withName(validation.create("required"), "required"),
                withName(validation.create("email"), "email")
            ]
        });

        // Assert 1
        const validation1 = await presenter.validateField(fieldName, {
            skipValidators: ["required"]
        });
        expect(validation1).toEqual({ isValid: true });

        // Assert 2
        const validation2 = await presenter.validateField(fieldName);
        expect(validation2).toEqual({ isValid: false, message: "Value is required." });

        // Assert 3
        await presenter.setFieldValue(fieldName, "not an email");
        const validation3 = await presenter.validateField(fieldName);
        expect(validation3).toEqual({
            isValid: false,
            message: "Value must be a valid e-mail address."
        });

        // Assert 4
        await presenter.setFieldValue(fieldName, "valid@email.com");
        const validation4 = await presenter.validateField(fieldName);
        expect(validation4).toEqual({
            isValid: true
        });
    });

    it("should validate the entire form", async () => {
        const presenter = new FormPresenter();

        presenter.init({
            data: {}
        });

        presenter.registerField({
            name: "firstName",
            validators: [validation.create("required")]
        });

        presenter.registerField({
            name: "lastName"
        });

        presenter.registerField({
            name: "email",
            validators: [validation.create("required,email")]
        });

        // Assert 1
        const validation1 = await presenter.validate();
        expect(validation1).toBe(false);
        expect(presenter.vm.invalidFields).toEqual({
            firstName: {
                isValid: false,
                message: "Value is required."
            },
            email: {
                isValid: false,
                message: "Value is required."
            }
        });

        // Assert 2
        await presenter.setFieldValue("firstName", "John");
        const validation2 = await presenter.validate();
        expect(validation2).toBe(false);
        expect(presenter.vm.invalidFields).toEqual({
            email: {
                isValid: false,
                message: "Value is required."
            }
        });

        // Assert 3
        await presenter.setFieldValue("email", "test@email.com");
        const validation3 = await presenter.validate();
        expect(validation3).toBe(true);
        expect(presenter.vm.invalidFields).toEqual({});
    });

    it("should set invalid fields", async () => {
        const presenter = new FormPresenter();

        presenter.init({
            data: {}
        });

        presenter.registerField({
            name: "email",
            validators: []
        });

        const validation1 = await presenter.validate();
        expect(validation1).toBe(true);

        presenter.setInvalidFields({
            email: "This email is already taken!"
        });

        expect(presenter.vm.invalidFields["email"]).toEqual({
            isValid: false,
            message: "This email is already taken!"
        });
    });

    it("should run form onChange callback", async () => {
        const onChangeSpy = jest.fn();
        const presenter = new FormPresenter();

        presenter.init({
            data: {},
            onChange: onChangeSpy
        });

        presenter.registerField({
            name: "email",
            validators: []
        });

        await presenter.setFieldValue("email", "test");
        await presenter.setFieldValue("email", "test@email");
        await presenter.setFieldValue("email", "test@email.com");

        expect(onChangeSpy).toHaveBeenCalledTimes(3);
        expect(onChangeSpy).toHaveBeenLastCalledWith({
            email: "test@email.com"
        });
    });

    it("should run form onInvalid callback", async () => {
        const onInvalidSpy = jest.fn();
        const presenter = new FormPresenter();

        presenter.init({
            data: {
                email: "not an email"
            },
            onInvalid: onInvalidSpy
        });

        presenter.registerField({
            name: "email",
            validators: [validation.create("email")]
        });

        await presenter.validate();

        expect(onInvalidSpy).toHaveBeenCalledTimes(1);
        expect(onInvalidSpy).toHaveBeenLastCalledWith({
            email: {
                isValid: false,
                message: "Value must be a valid e-mail address."
            }
        });
    });

    it("should set new form data", async () => {
        const presenter = new FormPresenter();

        presenter.init({
            data: {
                email: "not an email"
            }
        });

        expect(presenter.vm.data).toEqual({
            email: "not an email"
        });

        presenter.setData({
            email: "test@email.com",
            isVisible: true
        });

        expect(presenter.vm.data).toEqual({
            email: "test@email.com",
            isVisible: true
        });
    });
});
