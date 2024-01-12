import { BatchEditorDialogPresenter } from "./BatchEditorDialogPresenter";
import {
    BatchDTO,
    FieldDTO,
    OperatorDTO,
    OperatorType
} from "~/components/BulkActions/ActionEdit/domain";

describe("BatchEditorDialogPresenter", () => {
    const batch: BatchDTO = {
        operations: [
            {
                field: "",
                operator: "",
                value: undefined
            }
        ]
    };

    const fields: FieldDTO[] = [
        {
            label: "Field 1",
            value: "field1",
            operators: [
                {
                    label: "Override existing values",
                    value: OperatorType.OVERRIDE
                },
                {
                    label: "Clear all existing values",
                    value: OperatorType.REMOVE
                }
            ],
            raw: {
                id: "field1",
                fieldId: "field1",
                label: "Field 1",
                type: "text",
                renderer: {
                    name: "text-input"
                },
                tags: ["$bulk-edit"],
                storageId: "text@field1"
            }
        },
        {
            label: "Field 2",
            value: "field2",
            operators: [
                {
                    label: "Override existing values",
                    value: OperatorType.OVERRIDE
                },
                {
                    label: "Clear all existing values",
                    value: OperatorType.REMOVE
                }
            ],
            raw: {
                id: "field2",
                fieldId: "field2",
                label: "Field 1",
                type: "text",
                renderer: {
                    name: "text-input"
                },
                tags: ["$bulk-edit"],
                storageId: "text@field2"
            }
        }
    ];

    const operators: OperatorDTO[] = [
        {
            value: OperatorType.OVERRIDE,
            label: "Override existing values"
        },
        {
            value: OperatorType.REMOVE,
            label: "Clear all existing values"
        },
        {
            value: OperatorType.APPEND,
            label: "Append to existing values"
        }
    ];

    let presenter: BatchEditorDialogPresenter;

    beforeEach(() => {
        jest.clearAllMocks();
        presenter = new BatchEditorDialogPresenter();
    });

    it("should load data", () => {
        presenter.load(batch, fields);

        // `vm` should have the expected `data` definition
        expect(presenter.vm.data).toEqual({
            operations: [
                {
                    title: "Operation #1",
                    open: true,
                    canDelete: false,
                    field: "",
                    operator: "",
                    value: undefined,
                    fieldOptions: fields,
                    operatorOptions: [],
                    selectedField: undefined
                }
            ]
        });

        // `vm` should have the expected `invalidFields` definition
        expect(presenter.vm.invalidFields).toEqual({});

        // `vm` should have the expected `canAddOperation` definition
        expect(presenter.vm.canAddOperation).toEqual(true);
    });

    it("should be able to add and delete operations", () => {
        presenter.load(batch, fields);

        // should only have 1 operator, created by default
        expect(presenter.vm.data.operations.length).toBe(1);
        expect(presenter.vm.data.operations).toEqual([
            {
                title: "Operation #1",
                open: true,
                field: "",
                operator: "",
                value: undefined,
                canDelete: false,
                fieldOptions: fields,
                operatorOptions: [],
                selectedField: undefined
            }
        ]);

        presenter.addOperation();

        // should only have 2 operators
        expect(presenter.vm.data.operations.length).toBe(2);
        expect(presenter.vm.data.operations).toEqual([
            {
                title: "Operation #1",
                open: true,
                field: "",
                operator: "",
                value: undefined,
                canDelete: false,
                fieldOptions: fields,
                operatorOptions: [],
                selectedField: undefined
            },
            {
                title: "Operation #2",
                open: true,
                field: "",
                operator: "",
                value: undefined,
                canDelete: true,
                fieldOptions: fields,
                operatorOptions: [],
                selectedField: undefined
            }
        ]);

        // let's delete the first operation
        presenter.deleteOperation(0);

        expect(presenter.vm.data.operations.length).toBe(1);
        expect(presenter.vm.data.operations).toEqual([
            {
                title: "Operation #1",
                open: true,
                field: "",
                operator: "",
                value: undefined,
                canDelete: false,
                fieldOptions: fields,
                operatorOptions: [],
                selectedField: undefined
            }
        ]);

        // let's delete the remaining operation
        presenter.deleteOperation(0);

        // should still have 1 default operation
        expect(presenter.vm.data.operations.length).toBe(1);
        expect(presenter.vm.data.operations).toEqual([
            {
                title: "Operation #1",
                open: true,
                field: "",
                operator: "",
                value: undefined,
                canDelete: false,
                fieldOptions: fields,
                operatorOptions: [],
                selectedField: undefined
            }
        ]);
    });

    it("should be able to handle the `fieldOptions` based operations set in the batch", () => {
        presenter.load(batch, fields);

        // let's set some `data` back to the operation
        presenter.setBatch({
            operations: [
                {
                    title: `Override existing values for field "${fields[0].label}"`,
                    open: true,
                    field: fields[0].value,
                    operator: OperatorType.OVERRIDE,
                    value: {
                        [fields[0].value]: "newValue"
                    },
                    canDelete: false,
                    fieldOptions: fields,
                    operatorOptions: [operators[0], operators[1]],
                    selectedField: fields[0]
                }
            ]
        });

        // I should be able to add a new operation
        expect(presenter.vm.canAddOperation).toBeTruthy();

        presenter.addOperation();

        // Only the not-set field should be available
        expect(presenter.vm.data.operations[1]).toEqual({
            title: "Operation #2",
            open: true,
            field: "",
            operator: "",
            value: undefined,
            canDelete: true,
            fieldOptions: [fields[1]],
            operatorOptions: [],
            selectedField: undefined
        });

        // let's set some `data` back to the operations
        presenter.setBatch({
            operations: [
                {
                    title: `Override existing values for field "${fields[0].label}"`,
                    open: true,
                    field: fields[0].value,
                    operator: OperatorType.OVERRIDE,
                    value: {
                        [fields[0].value]: "newValue"
                    },
                    canDelete: false,
                    fieldOptions: fields,
                    operatorOptions: [operators[0], operators[1]],
                    selectedField: fields[0]
                },
                {
                    title: `Remove all values for field "${fields[1].label}"`,
                    open: false,
                    field: fields[1].value,
                    operator: OperatorType.REMOVE,
                    value: undefined,
                    canDelete: true,
                    fieldOptions: [fields[1]],
                    operatorOptions: [operators[0], operators[1]],
                    selectedField: fields[1]
                }
            ]
        });

        // I should NOT be able to add a new operation
        expect(presenter.vm.canAddOperation).toBeFalsy();
    });

    it("should be able to set data back to the operation", () => {
        presenter.load(batch, fields);

        // should be able to set the `data` operation
        presenter.setBatch({
            operations: [
                {
                    title: `Remove all values for field "${fields[0].label}"`,
                    open: false,
                    field: fields[0].value,
                    operator: OperatorType.OVERRIDE,
                    value: {
                        [fields[0].value]: "newValue"
                    },
                    canDelete: false,
                    fieldOptions: fields,
                    operatorOptions: [operators[0], operators[1]],
                    selectedField: fields[0]
                }
            ]
        });

        expect(presenter.vm.data.operations[0].field).toEqual(fields[0].value);
        expect(presenter.vm.data.operations[0].operator).toEqual(OperatorType.OVERRIDE);
        expect(presenter.vm.data.operations[0].value).toEqual({
            [fields[0].value]: "newValue"
        });
        expect(presenter.vm.data.operations[0].fieldOptions).toEqual(fields);
    });

    it("should able to set the operation `field` data", () => {
        presenter.load(batch, fields);

        presenter.setBatch({
            operations: [
                {
                    title: `Override existing values for field "${fields[0].label}"`,
                    open: true,
                    field: fields[0].value,
                    operator: OperatorType.OVERRIDE,
                    value: {
                        [fields[0].value]: "newValue"
                    },
                    canDelete: false,
                    fieldOptions: fields,
                    operatorOptions: [operators[0], operators[1]],
                    selectedField: fields[0]
                }
            ]
        });

        // let's empty the operation
        presenter.setOperationFieldData(0, "new-field");

        // should have an operation with default definition and new field value
        expect(presenter.vm.data.operations[0]).toEqual({
            title: "Operation #1",
            open: true,
            field: "new-field",
            operator: "",
            value: undefined,
            canDelete: false,
            fieldOptions: fields,
            operatorOptions: [],
            selectedField: undefined
        });
    });

    it("should perform validation and call provided callbacks `onApply`", () => {
        presenter.load(batch, fields);

        const onSuccess = jest.fn();
        const onError = jest.fn();

        presenter.setBatch({
            operations: [
                {
                    title: `Override existing values for field "${fields[0].label}"`,
                    open: true,
                    field: fields[0].value,
                    operator: "", // empty value -> this should trigger the error
                    value: undefined,
                    canDelete: false,
                    fieldOptions: fields,
                    operatorOptions: [operators[0], operators[1]],
                    selectedField: fields[0]
                }
            ]
        });

        presenter.onApply(onSuccess, onError);

        expect(onError).toBeCalledTimes(1);
        expect(Object.keys(presenter.vm.invalidFields).length).toBe(1);

        presenter.setBatch({
            operations: [
                {
                    title: `Override existing values for field "${fields[0].label}"`,
                    open: true,
                    field: fields[0].value,
                    operator: OperatorType.OVERRIDE,
                    value: {
                        [fields[0].value]: "newValue"
                    },
                    canDelete: false,
                    fieldOptions: fields,
                    operatorOptions: [operators[0], operators[1]],
                    selectedField: fields[0]
                }
            ]
        });

        presenter.onApply(onSuccess, onError);

        expect(onSuccess).toBeCalledTimes(1);
        expect(presenter.vm.invalidFields).toEqual({});
    });
});
