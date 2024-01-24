/**
 * @jest-environment jsdom
 */
import React, { useState } from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form, useBind, FormProps as BaseFormProps, BindComponentProps } from "~/index";
import { validation } from "@webiny/validation";

type FormProps = Omit<BaseFormProps, "children" | "onSubmit"> & {
    onSubmit?(data: any): void;
    children?: React.ReactNode;
};

const FormViewWithBind = ({ children, data, onSubmit, ...props }: FormProps) => {
    const [formData] = useState(data || { name: "empty name" });

    return (
        <Form data={formData} onSubmit={data => onSubmit && onSubmit(data)} {...props}>
            {({ Bind, form }) => (
                <div>
                    <Bind name={"name"}>
                        {({ value, onChange }) => (
                            <div>
                                <label htmlFor={"name"}>Name</label>
                                <input
                                    id={"name"}
                                    value={value || ""}
                                    onChange={e => onChange(e.target.value)}
                                />
                            </div>
                        )}
                    </Bind>
                    {children}
                    <button onClick={form.submit}>Submit</button>
                </div>
            )}
        </Form>
    );
};

const Input = (bindProps: BindComponentProps & { "data-testid"?: string }) => {
    const { value, onChange, validate, validation, disabled } = useBind(bindProps);

    return (
        <div>
            <label htmlFor={bindProps.name}>{bindProps.name}</label>
            <input
                id={bindProps.name}
                value={value || ""}
                data-testid={bindProps["data-testid"] || bindProps.name}
                onBlur={e => {
                    e.persist();
                    validate();
                }}
                onChange={e => onChange(e.target.value)}
            />
            {disabled ? <div data-testid={"is-disabled"} /> : null}
            {validation.isValid === false ? (
                <div data-testid={"validation-error"}>{validation.message}</div>
            ) : null}
            {validation.isValid === true ? (
                <div data-testid={"validation-success"}>Valid!</div>
            ) : null}
        </div>
    );
};

const FormViewWithHooks = ({ children = null, data, onSubmit, ...props }: FormProps) => {
    const [formData] = useState(data || { name: "empty name" });

    return (
        <Form data={formData} onSubmit={data => onSubmit && onSubmit(data)} {...props}>
            {({ form }) => (
                <div>
                    <Input name={"name"} />
                    {children}
                    <button onClick={form.submit}>Submit</button>
                </div>
            )}
        </Form>
    );
};

const assert = async (view: React.ReactElement, onSubmit: jest.MockedFunction<any>) => {
    render(view);
    const submitBtn = screen.getByRole("button", { name: /submit/i });
    const nameInput = screen.getByLabelText(/name/i);

    // Submit form without any user input.
    userEvent.click(submitBtn);
    await waitFor(() => onSubmit.mock.calls.length === 1);
    expect(onSubmit).toHaveBeenLastCalledWith({ name: "empty name" });

    // Take user input, then submit.
    userEvent.clear(nameInput);
    userEvent.type(nameInput, "Webiny");
    userEvent.click(submitBtn);
    await waitFor(() => onSubmit.mock.calls.length === 2);
    expect(onSubmit).toHaveBeenLastCalledWith({ name: "Webiny" });
};

describe("Form", () => {
    test("should call `onSubmit` callback with correct field values using `<Bind>`", async () => {
        const onSubmit = jest.fn();
        await assert(<FormViewWithBind onSubmit={onSubmit} />, onSubmit);
    });

    test("should call `onSubmit` callback with correct field values using `useBind()`", async () => {
        const onSubmit = jest.fn();
        await assert(<FormViewWithHooks onSubmit={onSubmit} />, onSubmit);
    });

    test("should render validation error specified via the `invalidFields` prop", async () => {
        const onSubmit = jest.fn();
        const { rerender } = render(<FormViewWithHooks onSubmit={onSubmit} />);

        // anchor
        expect(screen.queryByTestId("validation-error")).toBeNull();

        // pivot
        rerender(
            <FormViewWithHooks onSubmit={onSubmit} invalidFields={{ name: "Not a valid field!" }} />
        );

        expect(screen.queryByText("Not a valid field!")).toBeTruthy();
    });

    test("should validate data on form submit", async () => {
        jest.useFakeTimers();
        const onSubmit = jest.fn();
        const onInvalid = jest.fn();

        const formElement = (
            <FormViewWithHooks onSubmit={onSubmit} onInvalid={onInvalid}>
                <Input name={"price"} validators={validation.create("required,gt:100")} />
            </FormViewWithHooks>
        );

        const { rerender } = render(formElement);

        const submitBtn = screen.getByRole("button", { name: /submit/i });

        // anchor
        expect(screen.queryByTestId("validation-error")).toBeNull();
        expect(screen.queryByTestId("validation-success")).toBeNull();

        // pivot 1 - submit a form without any user input
        {
            userEvent.click(submitBtn);
            jest.runAllTimers();
            await waitFor(() => onInvalid.mock.calls.length > 0);
            rerender(formElement);
            const errorElement = screen.queryByTestId("validation-error");
            expect(onSubmit).toHaveBeenCalledTimes(0);
            expect(onInvalid).toHaveBeenCalledTimes(1);
            expect(errorElement).toBeTruthy();
            expect(errorElement!.innerHTML).toBe("Value is required.");
        }

        // pivot 2 - enter a partially valid value
        {
            onInvalid.mockReset();
            const priceInput = screen.getByTestId("price");
            userEvent.type(priceInput, "100");
            userEvent.click(submitBtn);
            jest.runAllTimers();
            await waitFor(() => onInvalid.mock.calls.length > 0);
            rerender(formElement);
            const errorElement = screen.queryByTestId("validation-error");
            expect(onSubmit).toHaveBeenCalledTimes(0);
            expect(onInvalid).toHaveBeenCalledTimes(1);
            expect(errorElement).toBeTruthy();
            expect(errorElement!.innerHTML).toBe("Value needs to be greater than 100.");
        }

        // pivot 3 - enter a valid value
        {
            onInvalid.mockReset();
            const priceInput = screen.getByTestId("price");
            userEvent.type(priceInput, "200");
            userEvent.click(submitBtn);
            jest.runAllTimers();
            await waitFor(() => onInvalid.mock.calls.length > 0);
            rerender(formElement);
            const successElement = screen.queryByTestId("validation-success");
            const errorElement = screen.queryByTestId("validation-error");
            expect(onSubmit).toHaveBeenCalledTimes(1);
            expect(onInvalid).toHaveBeenCalledTimes(0);
            expect(successElement).toBeTruthy();
            expect(errorElement).toBeNull();
            expect(successElement!.innerHTML).toBe("Valid!");
        }
    });

    test("should validate data change immediately, without form submission", async () => {
        jest.useFakeTimers();
        const onInvalid = jest.fn();

        const formElement = (
            <FormViewWithHooks onInvalid={onInvalid} validateOnFirstSubmit={false}>
                <Input name={"price"} validators={validation.create("required,gt:100")} />
            </FormViewWithHooks>
        );

        render(formElement);

        // anchor
        expect(screen.queryByTestId("validation-error")).toBeNull();
        expect(screen.queryByTestId("validation-success")).toBeNull();

        // pivot - enter an invalid value
        {
            const priceInput = screen.getByTestId("price");
            fireEvent.blur(priceInput);
            jest.runAllTimers();
            await waitFor(() => false);
            const errorElement = screen.queryByTestId("validation-error");
            expect(errorElement).toBeTruthy();
            expect(errorElement!.innerHTML).toBe("Value is required.");
        }
    });

    test("should submit form when Enter is pressed (if `submitOnEnter` prop is set)", async () => {
        await act(async () => {
            jest.useFakeTimers();

            const onSubmit = jest.fn();

            const hitEnter = () => {
                const inputElement = screen.getByTestId("name");
                fireEvent.keyDown(inputElement, { key: "Enter", code: "Enter", charCode: 13 });
            };

            const { rerender } = render(<FormViewWithHooks onSubmit={onSubmit} />);
            hitEnter();

            await waitFor(() => onSubmit.mock.calls.length === 0);

            rerender(<FormViewWithHooks onSubmit={onSubmit} submitOnEnter />);
            hitEnter();

            jest.runAllTimers();

            await waitFor(() => onSubmit.mock.calls.length > 0);
            expect(onSubmit).toHaveBeenLastCalledWith({ name: "empty name" });
        });
    });

    test("should execute the `onChange` callback whenever data is changed", async () => {
        const onChange = jest.fn();

        const formElement = (
            <FormViewWithHooks onChange={onChange}>
                <Input name={"price"} />
            </FormViewWithHooks>
        );
        render(formElement);

        const priceInput = screen.getByTestId("price");
        userEvent.type(priceInput, "100");
        expect(onChange).toHaveBeenCalledTimes(3);
        userEvent.type(priceInput, "200");
        expect(onChange).toHaveBeenCalledTimes(6);

        const [formData] = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(formData).toEqual({ name: "empty name", price: "100200" });
    });

    test("should disable all fields if Form is disabled", async () => {
        const { queryByTestId } = render(<FormViewWithHooks disabled />);

        expect(queryByTestId("is-disabled")).toBeTruthy();
    });
});
