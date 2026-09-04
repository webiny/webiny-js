import React from "react";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { useIsDragging } from "./useIsDragging.js";

interface PreviewContainerProps {
    children: React.ReactNode;
}

export const PreviewContainer = ({ children }: PreviewContainerProps) => {
    const uiHeight = useSelectFromEditor(state => state.uiReservedSpace.height);
    const isDragging = useIsDragging();

    return (
        <>
            <div className={"relative"}>
                <div
                    id={"preview-container"}
                    style={{ height: `calc(100vh - ${uiHeight}px)` }}
                    className={
                        "bg-neutral-subtle relative flex flex-col items-center w-full overflow-auto p-[24px]"
                    }
                >
                    {children}
                </div>
                {isDragging && (
                    <>
                        <div
                            className={
                                "absolute z-50 pointer-events-none animate-fade-in top-0 left-0 right-0 h-2 bg-primary-light"
                            }
                        />
                        <div
                            className={
                                "absolute z-50 pointer-events-none animate-fade-in bottom-0 left-0 right-0 h-2 bg-primary-light"
                            }
                        />
                        <div
                            className={
                                "absolute z-50 pointer-events-none animate-fade-in top-0 left-0 bottom-0 w-2 bg-primary-light"
                            }
                        />
                        <div
                            className={
                                "absolute z-50 pointer-events-none animate-fade-in top-0 right-0 bottom-0 w-2 bg-primary-light"
                            }
                        />
                    </>
                )}
            </div>
        </>
    );
};
