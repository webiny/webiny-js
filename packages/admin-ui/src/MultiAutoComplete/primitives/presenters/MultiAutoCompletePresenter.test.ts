import type { IMultiAutoCompletePresenter } from "./MultiAutoCompletePresenter.js";
import { MultiAutoCompletePresenter } from "./MultiAutoCompletePresenter.js";
import { MultiAutoCompleteInputPresenter } from "./MultiAutoCompleteInputPresenter.js";
import { MultiAutoCompleteSelectedOptionPresenter } from "./MultiAutoCompleteSelectedOptionsPresenter.js";
import { MultiAutoCompleteListOptionsPresenter } from "./MultiAutoCompleteListOptionsPresenter.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("MultiAutoCompletePresenter", () => {
    let presenter: IMultiAutoCompletePresenter;
    const onValuesChange = vi.fn();
    const onOpenChange = vi.fn();
    const onValuesReset = vi.fn();

    beforeEach(() => {
        const inputPresenter = new MultiAutoCompleteInputPresenter();
        const selectedOptionsPresenter = new MultiAutoCompleteSelectedOptionPresenter();
        const optionsListPresenter = new MultiAutoCompleteListOptionsPresenter();

        presenter = new MultiAutoCompletePresenter(
            inputPresenter,
            selectedOptionsPresenter,
            optionsListPresenter
        );
    });

    it("should return the compatible `vm.inputVm` based on params", () => {
        // `placeholder`
        {
            presenter.init({ placeholder: "Custom placeholder", onValuesChange });
            expect(presenter.vm.inputVm.placeholder).toEqual("Custom placeholder");
        }

        {
            // default: no params
            presenter.init({ onValuesChange });
            expect(presenter.vm.inputVm.placeholder).toEqual("Start typing or select");
            expect(presenter.vm.inputVm.displayResetAction).toEqual(true);
        }
    });

    it("should return the compatible `vm.selectedOptionsVm` based on params", () => {
        presenter.init({
            options: ["Option 1", "Option 2", "Option 3"],
            values: ["Option 1", "Option 2"],
            onValuesChange
        });
        expect(presenter.vm.selectedOptionsVm.options).toEqual([
            {
                value: "Option 1",
                label: "Option 1",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            },
            {
                value: "Option 2",
                label: "Option 2",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            }
        ]);
    });

    it("should return the compatible `vm.selectedOptionsVm` with  no params", () => {
        presenter.init({ options: ["Option 1", "Option 2"], onValuesChange });
        expect(presenter.vm.selectedOptionsVm.options).toEqual([]);
    });

    it("should return the compatible `vm.optionsListVm` based on params", () => {
        // with `options` as string
        {
            presenter.init({ options: ["Option 1", "Option 2"], onValuesChange });
            expect(presenter.vm.optionsListVm.options).toEqual([
                {
                    value: "Option 1",
                    label: "Option 1",
                    disabled: false,
                    selected: false,
                    separator: false,
                    item: null
                },
                {
                    value: "Option 2",
                    label: "Option 2",
                    disabled: false,
                    selected: false,
                    separator: false,
                    item: null
                }
            ]);
            expect(presenter.vm.optionsListVm.empty).toEqual(false);
        }

        // with `options` as formatted options
        {
            presenter.init({
                onValuesChange,
                options: [
                    {
                        value: "option-1",
                        label: "Option 1"
                    },
                    {
                        value: "option-2",
                        label: "Option 2"
                    },
                    {
                        value: "option-3",
                        label: "Option 3",
                        disabled: true
                    },
                    {
                        value: "option-4",
                        label: "Option 4",
                        separator: true
                    },
                    {
                        value: "option-5",
                        label: "Option 5",
                        item: {
                            anyKey1: "custom-value",
                            anyKey2: 2
                        }
                    }
                ]
            });

            expect(presenter.vm.optionsListVm.options).toEqual([
                {
                    value: "option-1",
                    label: "Option 1",
                    disabled: false,
                    selected: false,
                    separator: false,
                    item: null
                },
                {
                    value: "option-2",
                    label: "Option 2",
                    disabled: false,
                    selected: false, // `selected` is overwritten by the presenter
                    separator: false,
                    item: null
                },
                {
                    value: "option-3",
                    label: "Option 3",
                    disabled: true,
                    selected: false,
                    separator: false,
                    item: null
                },
                {
                    value: "option-4",
                    label: "Option 4",
                    disabled: false,
                    selected: false,
                    separator: true,
                    item: null
                },
                {
                    value: "option-5",
                    label: "Option 5",
                    disabled: false,
                    selected: false,
                    separator: false,
                    item: {
                        anyKey1: "custom-value",
                        anyKey2: 2
                    }
                }
            ]);
            expect(presenter.vm.optionsListVm.empty).toEqual(false);
        }

        // with `options` and `value`
        {
            presenter.init({
                onValuesChange,
                options: ["Option 1", "Option 2"],
                values: ["Option 1"]
            });
            expect(presenter.vm.optionsListVm.options).toEqual([
                {
                    value: "Option 1",
                    label: "Option 1",
                    disabled: false,
                    selected: true,
                    separator: false,
                    item: null
                },
                {
                    value: "Option 2",
                    label: "Option 2",
                    disabled: false,
                    selected: false,
                    separator: false,
                    item: null
                }
            ]);
            expect(presenter.vm.optionsListVm.empty).toEqual(false);
        }

        {
            // default: no params
            presenter.init({ onValuesChange });
            expect(presenter.vm.optionsListVm.options).toEqual([]);
            expect(presenter.vm.optionsListVm.emptyMessage).toEqual(
                "Start typing to find an option."
            );
            expect(presenter.vm.optionsListVm.loadingMessage).toEqual("Loading...");
            expect(presenter.vm.optionsListVm.open).toEqual(false);
            expect(presenter.vm.optionsListVm.empty).toEqual(true);
        }
    });

    it("should change the `optionsListVm` and `selectedOptionsVm` when `setSelectedOption` is called", () => {
        presenter.init({
            onValuesChange,
            options: [
                {
                    label: "Option 1",
                    value: "option-1"
                },
                {
                    label: "Option 2",
                    value: "option-2"
                }
            ]
        });

        expect(presenter.vm.optionsListVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            },
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            }
        ]);

        presenter.setSelectedOption("option-2");
        expect(onValuesChange).toHaveBeenCalledWith(["option-2"]);
        expect(presenter.vm.optionsListVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            },
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            }
        ]);
        expect(presenter.vm.selectedOptionsVm.options).toEqual([
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            }
        ]);

        presenter.setSelectedOption("option-1");
        expect(onValuesChange).toHaveBeenCalledWith(["option-2", "option-1"]);
        expect(presenter.vm.optionsListVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            },
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            }
        ]);

        expect(presenter.vm.selectedOptionsVm.options).toEqual([
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            },
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            }
        ]);
    });

    it("should change the `optionsListVm` and `selectedOptionsVm` when `removeSelectedOption` is called", () => {
        presenter.init({
            onValuesChange,
            options: [
                {
                    label: "Option 1",
                    value: "option-1"
                },
                {
                    label: "Option 2",
                    value: "option-2"
                }
            ],
            values: ["option-2", "option-1"]
        });

        expect(presenter.vm.optionsListVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            },
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            }
        ]);

        expect(presenter.vm.selectedOptionsVm.options).toEqual([
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            },
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            }
        ]);

        presenter.removeSelectedOption("option-2");
        expect(onValuesChange).toHaveBeenCalledWith(["option-1"]);
        expect(presenter.vm.optionsListVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            },
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            }
        ]);
        expect(presenter.vm.selectedOptionsVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            }
        ]);

        presenter.removeSelectedOption("option-1");
        expect(onValuesChange).toHaveBeenCalledWith([]);
        expect(presenter.vm.optionsListVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            },
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            }
        ]);
        expect(presenter.vm.selectedOptionsVm.options).toEqual([]);
    });

    it("should set the internal `inputValue` when `setInputValue` is called", () => {
        presenter.init({ onValuesChange });

        presenter.searchOption("value");
        expect(presenter.vm.inputVm.value).toEqual("value");
    });

    it("should set the option as `selected` when the presenter is initialized with a value", () => {
        presenter.init({
            onValuesChange,
            values: ["option-1"],
            options: [
                {
                    label: "Option 1",
                    value: "option-1"
                },
                {
                    label: "Option 2",
                    value: "option-2"
                }
            ]
        });

        expect(presenter.vm.optionsListVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            },
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            }
        ]);
        expect(presenter.vm.selectedOptionsVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            }
        ]);
    });

    it("should change the `optionListVm` and `selectedOptionsVm` when `resetSelectedOptions` is called", () => {
        presenter.init({
            onValuesChange,
            onValuesReset,
            options: [
                {
                    label: "Option 1",
                    value: "option-1"
                },
                {
                    label: "Option 2",
                    value: "option-2"
                }
            ]
        });

        expect(presenter.vm.optionsListVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            },
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            }
        ]);

        presenter.setSelectedOption("option-1");
        expect(presenter.vm.optionsListVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            },
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            }
        ]);
        expect(presenter.vm.selectedOptionsVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            }
        ]);

        presenter.resetSelectedOptions();
        expect(presenter.vm.optionsListVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            },
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            }
        ]);
        expect(presenter.vm.inputVm.value).toEqual("");
        expect(presenter.vm.selectedOptionsVm.options).toEqual([]);

        expect(onValuesChange).toHaveBeenCalledWith([]);
        expect(onValuesReset).toHaveBeenCalled();
    });

    it("should change `listVm` and call `onOpenChange` when `setListOpenState` is called", () => {
        // let's open it
        presenter.init({ onValuesChange, onOpenChange });
        presenter.setListOpenState(true);
        expect(presenter.vm.optionsListVm.open).toBe(true);
        expect(onOpenChange).toHaveBeenCalledWith(true);

        // let's close it
        presenter.setListOpenState(false);
        expect(presenter.vm.optionsListVm.open).toBe(false);
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should be able to create new options if `allowFreeInput` is set to true", () => {
        // This feature is disabled by default
        presenter.init({ onValuesChange });
        presenter.searchOption("New Option 1");
        presenter.createOption("New Option 1");
        expect(presenter.vm.selectedOptionsVm.empty).toEqual(true);
        expect(presenter.vm.selectedOptionsVm.options).toEqual([]);
    });

    it("should not display the reset action if `displayResetAction` is set to `false` and option is selected", () => {
        presenter.init({
            onValuesChange,
            options: [
                {
                    label: "Option 1",
                    value: "option-1"
                },
                {
                    label: "Option 2",
                    value: "option-2"
                }
            ],
            displayResetAction: false
        });

        presenter.setSelectedOption("option-2");
        expect(onValuesChange).toHaveBeenCalledWith(["option-2"]);
        // `displayResetAction` is set to `false` and option is selected
        expect(presenter.vm.inputVm.displayResetAction).toEqual(false);
        expect(presenter.vm.optionsListVm.options).toEqual([
            {
                label: "Option 1",
                value: "option-1",
                disabled: false,
                selected: false,
                separator: false,
                item: null
            },
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            }
        ]);
        expect(presenter.vm.selectedOptionsVm.options).toEqual([
            {
                label: "Option 2",
                value: "option-2",
                disabled: false,
                selected: true,
                separator: false,
                item: null
            }
        ]);
    });
});
