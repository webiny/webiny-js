import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { CheckboxGroup } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import type { WebhookEvent } from "~/admin/shared/types.js";

interface EventsSelectorProps {
    availableEvents: WebhookEvent[];
    selectedEvents: string[];
    onToggle: (eventName: string) => void;
    disabled?: boolean;
}

export const EventsSelector = observer(function EventsSelector({
    availableEvents,
    selectedEvents,
    onToggle,
    disabled
}: EventsSelectorProps) {
    const grouped = useMemo(() => {
        const map = new Map<string, WebhookEvent[]>();

        for (const event of availableEvents) {
            const existing = map.get(event.app) ?? [];
            existing.push(event);
            map.set(event.app, existing);
        }

        return map;
    }, [availableEvents]);

    return (
        <div className="flex flex-col gap-md">
            <Heading level={6}>Events</Heading>
            {Array.from(grouped.entries()).map(([app, events]) => (
                <div key={app} className="flex flex-col gap-sm">
                    <Heading level={6} className="text-neutral-strong">
                        {app}
                    </Heading>
                    <CheckboxGroup
                        items={events.map(e => ({
                            id: e.eventName,
                            label: e.label,
                            value: e.eventName
                        }))}
                        value={selectedEvents}
                        onChange={values => {
                            const current = new Set(selectedEvents);
                            const next = new Set(values as string[]);

                            for (const v of next) {
                                if (!current.has(v)) {
                                    onToggle(v);
                                }
                            }

                            for (const v of current) {
                                if (!next.has(v) && events.some(e => e.eventName === v)) {
                                    onToggle(v);
                                }
                            }
                        }}
                        disabled={disabled}
                    />
                    <Separator />
                </div>
            ))}
        </div>
    );
});
