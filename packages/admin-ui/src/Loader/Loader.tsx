import React, { useState, useEffect } from "react";
import { Text } from "~/Text/index.js";
import { cn, cva, makeDecoratable, type VariantProps } from "~/utils.js";

const loaderVariants = cva("relative translate", {
    variants: {
        size: {
            xs: "size-md",
            sm: "size-md-plus",
            md: "size-lg",
            lg: "size-[40px]"
        }
    },
    defaultVariants: {
        size: "md"
    }
});

const loaderBaseVariant = cva("stroke ", {
    variants: {
        variant: {
            accent: "opacity-10 text-neutral-primary",
            subtle: "opacity-10 text-neutral-primary",
            negative: "opacity-20 text-neutral-light"
        }
    },
    defaultVariants: {
        variant: "accent"
    }
});

const loaderActiveVariant = cva("opacity-100", {
    variants: {
        variant: {
            accent: "text-accent-primary",
            subtle: "opacity-50 text-neutral-primary",
            negative: "text-neutral-light"
        }
    },
    defaultVariants: {
        variant: "accent"
    }
});

interface LoaderProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof loaderVariants>,
        VariantProps<typeof loaderBaseVariant> {
    max?: number;
    value?: number;
    min?: number;
    className?: string;
    indeterminate?: boolean;
    text?: React.ReactNode;
}

const DecoratableLoader = ({
    max = 100,
    min = 0,
    value = 66,
    indeterminate = true,
    className,
    size,
    variant,
    text,
    ...props
}: LoaderProps) => {
    const circumference = 2 * Math.PI * 45;
    const percentPx = circumference / 100;
    const currentPercent = Math.round(((value - min) / (max - min)) * 100);

    const [rotation, setRotation] = useState(0);
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (indeterminate) {
            // Rotate the loader by 10 degrees every 30ms when indeterminate
            interval = setInterval(() => {
                setRotation(prev => (prev + 10) % 360);
            }, 30);
        } else {
            setRotation(0);
        }
        return () => clearInterval(interval);
    }, [indeterminate]);

    return (
        <div {...props} className={"text-center flex flex-col items-center"}>
            <div className={cn(loaderVariants({ size }), className)}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    className="size-full stroke-current"
                    strokeWidth="12"
                    viewBox="0 0 100 100"
                >
                    <circle
                        cx="50"
                        cy="50"
                        r="44"
                        strokeDashoffset="0"
                        className={cn(loaderBaseVariant({ variant }))}
                        style={{
                            strokeDasharray: `${circumference}px ${circumference}px`,
                            transition: "all 1s ease 0s",
                            transformOrigin: "50px 50px"
                        }}
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r="44"
                        strokeDashoffset="0"
                        className={cn(loaderActiveVariant({ variant }))}
                        style={{
                            strokeDasharray: `${currentPercent * percentPx}px ${circumference}px`,
                            transition: indeterminate ? "none" : "500ms ease 0s",
                            transitionProperty: indeterminate
                                ? "transform"
                                : "stroke-dasharray, transform",
                            transform: indeterminate
                                ? `rotate(${rotation}deg)` // Rotate when indeterminate
                                : "rotate(-90deg)",
                            transformOrigin: "50px 50px"
                        }}
                    />
                </svg>
            </div>
            {text && (
                <Text as={"div"} className={"text-neutral-strong w-full pt-sm-plus"}>
                    {text}
                </Text>
            )}
        </div>
    );
};

const Loader = makeDecoratable("Loader", DecoratableLoader);

export { Loader, type LoaderProps };
