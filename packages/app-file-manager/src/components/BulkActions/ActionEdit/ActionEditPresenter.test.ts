import { ActionEditPresenter } from "./ActionEditPresenter";
import { FieldRaw } from "~/components/BulkActions/ActionEdit/domain";

describe("ActionEditPresenter", () => {
    const extensionFields = [
        {
            id: "field1",
            fieldId: "field1",
            label: "Field 1",
            type: "text",
            renderer: {
                name: "text-input"
            },
            tags: ["$bulk-edit"],
            storageId: "text@field1"
        },
        {
            id: "field2",
            fieldId: "field2",
            label: "Field 2",
            type: "ref",
            renderer: {
                name: "ref-inputs"
            },
            multipleValues: true,
            settings: {
                models: [
                    {
                        modelId: "any-model"
                    }
                ]
            },
            tags: ["$bulk-edit"],
            storageId: "ref@field2"
        },
        {
            id: "field3",
            fieldId: "field3",
            label: "Field 3",
            type: "number",
            renderer: {
                name: "number-input"
            },
            tags: [],
            storageId: "number@field3"
        }
    ];

    const createFields = (extensionFields: FieldRaw[]) => {
        return [
            {
                id: "name",
                storageId: "text@name",
                fieldId: "name",
                label: "Name",
                type: "text",
                settings: {},
                listValidation: [],
                validation: [
                    {
                        name: "required",
                        message: "Value is required."
                    }
                ],
                multipleValues: false,
                predefinedValues: {
                    values: [],
                    enabled: false
                },
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "extensions",
                storageId: "object@extensions",
                fieldId: "extensions",
                label: "Extensions",
                type: "object",
                settings: {
                    layout: extensionFields.map(field => [field.id]),
                    fields: extensionFields
                },
                listValidation: [],
                validation: [],
                multipleValues: false,
                predefinedValues: {
                    values: [],
                    enabled: false
                },
                renderer: {
                    name: "any"
                }
            }
        ];
    };

    let presenter: ActionEditPresenter;

    beforeEach(() => {
        jest.clearAllMocks();
        presenter = new ActionEditPresenter();
    });

    it("should create a presenter and load extensions fields", () => {
        presenter.load(createFields(extensionFields));

        // I should see the bulk edit action
        expect(presenter.vm.show).toEqual(true);

        // I should receive a `currentBatch`
        expect(presenter.vm.currentBatch).toEqual({
            operations: [
                {
                    field: "",
                    operator: "",
                    value: undefined
                }
            ]
        });

        // I should receive the `fields` available for bulk edit
        expect(presenter.vm.fields).toEqual([
            {
                label: "Field 1",
                value: "extensions.field1",
                operators: [
                    {
                        label: "Override existing values",
                        value: "OVERRIDE"
                    },
                    {
                        label: "Clear all existing values",
                        value: "REMOVE"
                    }
                ],
                raw: extensionFields[0]
            },
            {
                label: "Field 2",
                value: "extensions.field2",
                operators: [
                    {
                        label: "Override existing values",
                        value: "OVERRIDE"
                    },
                    {
                        label: "Clear all existing values",
                        value: "REMOVE"
                    },
                    {
                        label: "Append to existing values",
                        value: "APPEND"
                    }
                ],
                raw: extensionFields[1]
            }
        ]);

        // I should receive the editor.vm
        expect(presenter.vm.editorVm).toEqual({
            isOpen: false
        });
    });

    it("should not show the bulk action if no `extensions` fields are defined", () => {
        presenter.load(createFields([]));

        // The editor action should not be rendered
        expect(presenter.vm.show).toBe(false);
    });

    it("should open / close the editor", () => {
        presenter.load(createFields(extensionFields));

        // The editor should be closed by default
        expect(presenter.vm.editorVm.isOpen).toBe(false);

        // Let's open the editor
        presenter.openEditor();
        expect(presenter.vm.editorVm.isOpen).toBe(true);

        // Let's open the editor
        presenter.closeEditor();
        expect(presenter.vm.editorVm.isOpen).toBe(false);
    });
});
