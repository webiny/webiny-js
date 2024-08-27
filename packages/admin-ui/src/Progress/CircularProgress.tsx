import * as React from "react";
import { Text } from "~/Text";
import { cn } from "~/utils";
import { makeDecoratable } from "@webiny/react-composition";

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    text?: React.ReactNode;
    spinnerWidth?: number;
}

const CircularProgressBase = React.forwardRef<HTMLDivElement, CircularProgressProps>(
    (props, ref) => {
        const { text = "", className, spinnerWidth = 48, ...divProps } = props;

        return (
            <div
                ref={ref}
                className={cn(
                    "w-full h-full absolute bg-white bg-opacity-75 top-0 left-0 z-30",
                    className
                )}
                {...divProps}
            >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={spinnerWidth}
                        height={spinnerWidth}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={"animate-spin text-primary"}
                    >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    {props.text && <Text text={text} />}
                </div>
            </div>
        );
    }
);

CircularProgressBase.displayName = "CircularProgress";

const CircularProgress = makeDecoratable("CircularProgress", CircularProgressBase);

export { CircularProgress, CircularProgressProps };
