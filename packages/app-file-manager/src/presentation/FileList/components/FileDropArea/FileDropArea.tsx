import React from "react";
import { Button, cn, Heading, Text } from "@webiny/admin-ui";
import { ReactComponent as UploadFileIcon } from "@webiny/icons/file_upload.svg";
import { ReactComponent as UploadIcon } from "@webiny/icons/cloud_upload.svg";

interface DropAreaContainerProps {
    empty?: boolean;
    children: React.ReactNode;
}

const DropAreaContainer = ({ empty, children }: DropAreaContainerProps) => (
    <div
        className={cn([
            "w-full h-full p-lg flex items-center justify-center",
            empty ? "bg-neutral-base" : "pt-xxl bg-neutral-xstrong/20"
        ])}
    >
        {children}
    </div>
);

interface DropAreaBoxProps {
    empty?: boolean;
    children: React.ReactNode;
}

const DropAreaBox = ({ children, empty }: DropAreaBoxProps) => (
    <div
        style={{
            width: "650px",
            height: "400px",
            ...(empty
                ? {
                      backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23E7E7E7FF' stroke-width='4' stroke-dasharray='12' stroke-dashoffset='35' stroke-linecap='square'/%3e%3c/svg%3e")`
                  }
                : {})
        }}
        className={cn([
            "flex flex-col items-center justify-center gap-lg",
            "p-lg rounded-3xl",
            "bg-neutral-base",
            !empty && "shadow-md"
        ])}
    >
        {children}
    </div>
);

interface DropAreaContentProps {
    empty?: boolean;
    title?: string;
    description?: string;
}

const DropAreaContent = ({ title, description }: DropAreaContentProps) => (
    <div className={"flex flex-col items-center justify-center gap-sm"}>
        <div className={"fill-neutral-strong"}>
            <UploadIcon width={75} height={75} />
        </div>
        <div className={"text-center"}>
            {title && (
                <Heading level={4} className={"text-neutral-strong"}>
                    {title}
                </Heading>
            )}
            {description && (
                <Text as={"div"} style={{ width: "300px" }} className={"text-neutral-strong"}>
                    {description}
                </Text>
            )}
        </div>
    </div>
);

interface DropAreaButtonProps {
    onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
}

const DropAreaButton = ({ onClick }: DropAreaButtonProps) => (
    <div>
        <Button onClick={onClick} text={"Upload files"} icon={<UploadFileIcon />} />
    </div>
);

export interface FileDropAreaProps {
    empty?: boolean;
    onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
    title?: string;
    description?: string;
    icon?: React.ReactElement;
}

export const FileDropArea = ({ title, description, empty, onClick }: FileDropAreaProps) => (
    <DropAreaContainer empty={empty}>
        <DropAreaBox empty={empty}>
            <DropAreaContent title={title} description={description} />
            {empty && <DropAreaButton onClick={onClick} />}
        </DropAreaBox>
    </DropAreaContainer>
);
