import React, { useState } from "react";
import { Button, Icon, Input } from "@webiny/admin-ui";
import { ReactComponent as SendIcon } from "@webiny/icons/send.svg";
import { Command } from "../abstractions.js";

/**
 * DEMO command showcasing a `detailView`: selecting it opens a form inside the palette,
 * and submitting calls `execute(data)`. Safe to remove — kept as a live example of the
 * detail-view capability.
 */
const SendMessageDetailView = ({ command, onClose }: Command.DetailProps) => {
    const [recipient, setRecipient] = useState("");
    const [message, setMessage] = useState("");

    return (
        <div className="flex flex-col gap-sm p-md">
            <Input
                label="Recipient"
                value={recipient}
                onChange={setRecipient}
                placeholder="Enter recipient"
                autoFocus
            />
            <Input
                label="Message"
                value={message}
                onChange={setMessage}
                placeholder="Enter your message"
            />
            <div className="flex justify-end pt-sm">
                <Button
                    variant="primary"
                    text="Send"
                    onClick={() => {
                        command.execute({ recipient, message });
                        onClose();
                    }}
                />
            </div>
        </div>
    );
};

class SendMessageCommandImpl implements Command.Interface {
    name = "admin.demo.sendMessage";
    label = "Send message";
    description = "Demo — a form rendered inside the palette";
    category = "Demo";
    keywords = ["demo", "form", "message"];
    shortcut = "cmd+shift+m";
    icon = <Icon icon={<SendIcon />} size="sm" color="neutral-strong" label="" />;
    detailView = SendMessageDetailView;

    execute(params?: unknown) {
        const data = params as { recipient?: string; message?: string } | undefined;
        window.alert(`Message to ${data?.recipient || "?"}: ${data?.message || ""}`);
    }
}

export const SendMessageCommand = Command.createImplementation({
    implementation: SendMessageCommandImpl,
    dependencies: []
});
