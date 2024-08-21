import * as React from "react";
import { cn } from "~/utils";

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    label?: React.ReactNode;
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>((props, ref) => {
    return (
        <div>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn("animate-spin text-primary", props.className)}
            >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            {props.label && <div className="mt-2 text-primary">{props.label}</div>}
        </div>
    );
});

CircularProgress.displayName = "CircularProgress";

export { CircularProgress };
