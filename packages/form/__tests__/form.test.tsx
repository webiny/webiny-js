import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form, useBind } from "~/index";

interface FormViewProps {
    onSubmit(data: any): void;
}

const FormViewWithBind: React.FC<FormViewProps> = ({ onSubmit }) => {
    return (
        <Form data={{ name: "empty name" }} onSubmit={data => onSubmit(data)}>
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
                    <button onClick={form.submit}>Submit</button>
                </div>
            )}
        </Form>
    );
};

const Input = () => {
    const { value, onChange } = useBind({ name: "name" });
    return (
        <div>
            <label htmlFor={"name"}>Name</label>
            <input id={"name"} value={value || ""} onChange={e => onChange(e.target.value)} />
        </div>
    );
};

const FormViewWithHooks: React.FC<FormViewProps> = ({ onSubmit }) => {
    return (
        <Form data={{ name: "empty name" }} onSubmit={data => onSubmit(data)}>
            {({ form }) => (
                <div>
                    <Input />
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
});
