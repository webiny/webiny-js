import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Alert, Heading } from "@webiny/admin-ui";

interface PresenterErrorsProps {
    title?: string;
    errors: string[];
}

export const PresenterErrors = observer(({ errors, ...props }: PresenterErrorsProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const title = props.title ?? "Some issues need your attention";

    useEffect(() => {
        if (errors.length > 0 && ref.current) {
            ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [errors]);

    if (errors.length === 0) {
        return null;
    }

    return (
        <div ref={ref}>
            <Alert type="danger" variant="subtle">
                <Heading level={6}>{title}</Heading>
                <ul className="list-disc mt-sm">
                    {errors.map((message, index) => (
                        <li key={index} className={"my-xs"}>
                            {message}
                        </li>
                    ))}
                </ul>
            </Alert>
        </div>
    );
});
