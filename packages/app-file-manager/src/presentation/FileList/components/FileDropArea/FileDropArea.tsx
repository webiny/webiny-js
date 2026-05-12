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
            "wby-w-full wby-h-full wby-p-lg wby-flex wby-items-center wby-justify-center",
            empty ? "wby-bg-neutral-base" : "wby-pt-xxl wby-bg-neutral-xstrong/20"
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
            "-wby-translate-y-xl",
            "wby-flex wby-flex-col wby-items-center wby-justify-center wby-gap-lg",
            "wby-p-lg wby-rounded-3xl",
            "wby-bg-neutral-base",
            !empty && "wby-shadow-md"
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
    <div className={"wby-flex wby-flex-col wby-items-center wby-justify-center wby-gap-sm"}>
        <div className={"wby-fill-neutral-strong"}>
            <UploadIcon width={75} height={75} />
        </div>
        <div className={"wby-text-center"}>
            {title && (
                <Heading level={4} className={"wby-text-neutral-strong"}>
                    {title}
                </Heading>
            )}
            {description && (
                <Text as={"div"} style={{ width: "300px" }} className={"wby-text-neutral-strong"}>
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
