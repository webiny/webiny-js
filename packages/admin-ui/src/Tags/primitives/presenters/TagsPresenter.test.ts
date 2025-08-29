import { type ITagsPresenter, TagsPresenter } from "./TagsPresenter";
import { TagsValuesPresenter } from "./TagsValuesPresenter";
import { TagsInputPresenter } from "./TagsInputPresenter";

const createPresenter = (): ITagsPresenter => {
    const tagsInputPresenter = new TagsInputPresenter();
    const tagsValuesPresenter = new TagsValuesPresenter();
    return new TagsPresenter(tagsInputPresenter, tagsValuesPresenter);
};

describe("TagsPresenter", () => {
    const onValueChange = jest.fn();
    const onValueInput = jest.fn();
    const onValueAdd = jest.fn();
    const onValueRemove = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return the compatible `vm.inputVm` based on", () => {
        const presenter = createPresenter();
        presenter.init({
            placeholder: "Custom placeholder"
        });

        expect(presenter.vm.inputVm.placeholder).toBe("Custom placeholder");
    });

    it("should return the compatible `vm.valuesVm` based on", () => {
        const presenter = createPresenter();
        presenter.init({
            values: ["tag1", "tag2"]
        });

        expect(presenter.vm.valuesVm.values).toEqual([
            {
                id: expect.any(String),
                label: "tag1",
                protected: false
            },
            {
                id: expect.any(String),
                label: "tag2",
                protected: false
            }
        ]);
    });

    it("should call `onValueInput` and add the new value when input a value", () => {
        const presenter = createPresenter();
        presenter.init({
            onValueInput
        });

        const value1 = "value 1";
        presenter.inputValue(value1);

        expect(onValueInput).toHaveBeenCalledWith(value1);
        expect(presenter.vm.inputVm.value).toBe(value1);

        const value2 = "value 2";
        presenter.inputValue(value2);
        expect(onValueInput).toHaveBeenCalledWith(value2);
        expect(presenter.vm.inputVm.value).toBe(value2);
    });

    it("should call `onValueAdd` and add the new value when adding a value", () => {
        const presenter = createPresenter();
        presenter.init({
            onValueAdd,
            onValueChange
        });

        // It should add a value and call `onValueAdd` and `onValueChange`
        const value1 = "value 1";
        presenter.inputValue(value1);
        presenter.addValue(value1);

        expect(onValueAdd).toHaveBeenCalledWith(value1);
        expect(presenter.vm.valuesVm.values).toEqual([
            {
                id: expect.any(String),
                label: value1,
                protected: false
            }
        ]);
        expect(onValueChange).toHaveBeenCalledWith([value1]);

        // It should add another value and call `onValueAdd` and `onValueChange`
        const value2 = "value 2";
        presenter.inputValue(value2);
        presenter.addValue(value2);

        expect(onValueAdd).toHaveBeenCalledWith(value2);
        expect(presenter.vm.valuesVm.values).toEqual([
            {
                id: expect.any(String),
                label: value1,
                protected: false
            },
            {
                id: expect.any(String),
                label: value2,
                protected: false
            }
        ]);
        expect(onValueChange).toHaveBeenCalledWith([value1, value2]);

        // It should not add an empty value
        const emptyValue = " ";
        presenter.inputValue(emptyValue);
        presenter.addValue(emptyValue);

        expect(onValueAdd).not.toHaveBeenCalledWith(emptyValue);
        expect(presenter.vm.valuesVm.values).toEqual([
            {
                id: expect.any(String),
                label: value1,
                protected: false
            },
            {
                id: expect.any(String),
                label: value2,
                protected: false
            }
        ]);
        expect(onValueChange).toHaveBeenCalledWith([value1, value2]);

        // It should not add a duplicate value
        presenter.inputValue(value1);
        presenter.addValue(value1);

        expect(onValueAdd).not.toHaveBeenLastCalledWith(value1);
        expect(presenter.vm.valuesVm.values).toEqual([
            {
                id: expect.any(String),
                label: value1,
                protected: false
            },
            {
                id: expect.any(String),
                label: value2,
                protected: false
            }
        ]);
    });

    it("should call `onValueRemove` and remove the value when removing a value", () => {
        const presenter = createPresenter();
        const initialValues = ["tag1", "tag2"];
        presenter.init({
            values: initialValues,
            onValueRemove,
            onValueChange
        });

        const valueToRemove = "tag1";
        presenter.removeValue(valueToRemove);

        expect(onValueRemove).toHaveBeenCalledWith(valueToRemove);
        expect(presenter.vm.valuesVm.values).toEqual([
            {
                id: expect.any(String),
                label: "tag2",
                protected: false
            }
        ]);
        expect(onValueChange).toHaveBeenCalledWith(["tag2"]);
    });

    it("should not remove a protected value", () => {
        const presenter = createPresenter();
        const initialValues = ["tag1", "tag2"];
        const protectedValues = ["tag1"];
        presenter.init({
            values: initialValues,
            protectedValues,
            onValueRemove,
            onValueChange
        });

        expect(presenter.vm.valuesVm.values).toEqual([
            {
                id: expect.any(String),
                label: "tag1",
                protected: true
            },
            {
                id: expect.any(String),
                label: "tag2",
                protected: false
            }
        ]);

        const valueToRemove = "tag1";
        presenter.removeValue(valueToRemove);

        expect(onValueRemove).not.toHaveBeenCalled();
        expect(onValueChange).not.toHaveBeenCalled();
        expect(presenter.vm.valuesVm.values).toEqual([
            {
                id: expect.any(String),
                label: "tag1",
                protected: true
            },
            {
                id: expect.any(String),
                label: "tag2",
                protected: false
            }
        ]);
    });

    it("should not remove a value based on a pattern", () => {
        const presenter = createPresenter();
        const initialValues = ["tag1", "tag2", "another-tag"];
        const protectedValues = ["tag*"];
        presenter.init({
            values: initialValues,
            protectedValues,
            onValueRemove,
            onValueChange
        });

        expect(presenter.vm.valuesVm.values).toEqual([
            {
                id: expect.any(String),
                label: "tag1",
                protected: true
            },
            {
                id: expect.any(String),
                label: "tag2",
                protected: true
            },
            {
                id: expect.any(String),
                label: "another-tag",
                protected: false
            }
        ]);

        // Try to remove a protected value
        const valueToRemove = "tag1";
        presenter.removeValue(valueToRemove);

        expect(onValueRemove).not.toHaveBeenCalled();
        expect(onValueChange).not.toHaveBeenCalled();
        expect(presenter.vm.valuesVm.values).toEqual([
            {
                id: expect.any(String),
                label: "tag1",
                protected: true
            },
            {
                id: expect.any(String),
                label: "tag2",
                protected: true
            },
            {
                id: expect.any(String),
                label: "another-tag",
                protected: false
            }
        ]);

        // Try to remove a non-protected value
        const anotherValueToRemove = "another-tag";
        presenter.removeValue(anotherValueToRemove);

        expect(onValueRemove).toHaveBeenCalledWith(anotherValueToRemove);
        expect(onValueChange).toHaveBeenCalledWith(["tag1", "tag2"]);
        expect(presenter.vm.valuesVm.values).toEqual([
            {
                id: expect.any(String),
                label: "tag1",
                protected: true
            },
            {
                id: expect.any(String),
                label: "tag2",
                protected: true
            }
        ]);
    });
});
