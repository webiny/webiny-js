import { RadioGroupPresenter } from "./RadioGroupPresenter.js";
import { describe, expect, it, vi } from "vitest";

describe("RadioGroupPresenter", () => {
    const onValueChange = vi.fn();

    it("should return the compatible `vm` based on props", () => {
        // `items`
        {
            const presenter = new RadioGroupPresenter();
            presenter.init({
                onValueChange,
                items: [
                    {
                        value: "value-1",
                        label: "Value 1"
                    },
                    {
                        value: "value-2",
                        label: "Value 2"
                    }
                ]
            });
            expect(presenter.vm.items).toEqual([
                {
                    id: expect.any(String),
                    value: "value-1",
                    label: "Value 1",
                    disabled: false
                },
                {
                    id: expect.any(String),
                    value: "value-2",
                    label: "Value 2",
                    disabled: false
                }
            ]);
        }
    });

    it("should pass the item `description` through to the `vm`", () => {
        const presenter = new RadioGroupPresenter();
        presenter.init({
            items: [
                { value: "value-1", label: "Value 1", description: "Described" },
                { value: "value-2", label: "Value 2" }
            ]
        });
        expect(presenter.vm.items).toEqual([
            {
                id: expect.any(String),
                value: "value-1",
                label: "Value 1",
                disabled: false,
                description: "Described"
            },
            {
                id: expect.any(String),
                value: "value-2",
                label: "Value 2",
                disabled: false,
                description: undefined
            }
        ]);
    });

    it("should call `onValueChange` callback when `changeValue` is called", () => {
        const presenter = new RadioGroupPresenter();
        presenter.init({
            onValueChange,
            items: [
                {
                    value: "value-1",
                    label: "Value 1"
                },
                {
                    value: "value-2",
                    label: "Value 2"
                }
            ]
        });
        presenter.changeValue("value-2");
        expect(onValueChange).toHaveBeenCalledWith("value-2");
    });
});
