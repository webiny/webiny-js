import React from "react";
import { Form, Bind } from "webiny/admin/form";
import { Input, Button } from "webiny/admin/ui";
import { Command } from "webiny/admin";

interface FormData {
    recipient: string;
    message: string;
}

export const SendMessageDetailView = ({ command, onClose }: Command.DetailProps) => {
    return (
        <Form<FormData>
            data={{ recipient: "", message: "" }}
            onSubmit={data => {
                command.execute(data);
                onClose();
            }}
        >
            {({ submit }) => (
                <div className="p-md space-y-md">
                    <Bind name="recipient">
                        <Input
                            label="Recipient"
                            placeholder="Enter recipient name"
                            autoFocus={true}
                        />
                    </Bind>
                    <Bind name="message">
                        <Input label="Message" placeholder="Enter your message" />
                    </Bind>
                    <div className="flex justify-end gap-sm pt-sm">
                        <Button variant="primary" onClick={submit}>
                            Send
                        </Button>
                    </div>
                </div>
            )}
        </Form>
    );
};
