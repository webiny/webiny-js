import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import FileManagerView, { FileManagerViewProps } from "./FileManager/FileManagerView";
import pick from "lodash/pick";
import { FileManagerProvider } from "./FileManager/FileManagerContext";
import { FileItem } from "./FileManager/types";

export interface ShowFileManagerCallable {
    (onChange?: (file?: FileItem | FileItem[]) => void): void;
}
export interface FileManagerPropsChildren {
    showFileManager: ShowFileManagerCallable;
}

export interface FileManagerProps {
    onChange?: (files: FileItem[] | FileItem) => void;
    onChangePick?: string[];
    images?: boolean;
    multiple?: boolean;
    accept?: Array<string>;
    tags?: Array<string>;
    scope?: string;
    own?: boolean;
    children: (params: FileManagerPropsChildren) => React.ReactNode;
    maxSize?: number | string;
    multipleMaxCount?: number;
    multipleMaxSize?: number | string;
    onClose?: Function;
    onUploadCompletion?: (files: FileItem[]) => void;
}

export type FileManagerPortalProps = Omit<FileManagerProps, "children">;

class FileManagerPortal extends React.Component<FileManagerPortalProps> {
    public container: HTMLElement | null = null;
    constructor(props: FileManagerPortalProps) {
        super(props);

        if (!window) {
            return;
        }

        this.container = window.document.getElementById("file-manager-container");

        if (!this.container) {
            this.container = document.createElement("div");
            this.container.setAttribute("id", "file-manager-container");
            const container = this.container;
            document.body && document.body.appendChild(container);
        }
    }

    public override render() {
        const {
            onChange = () => {
                return void 0;
            },
            onClose = () => {
                return void 0;
            },
            accept,
            onChangePick,
            multiple,
            images,
            maxSize,
            multipleMaxCount,
            multipleMaxSize,
            onUploadCompletion,
            tags,
            scope,
            own
        } = this.props;

        const container = this.container as HTMLElement;

        const handleFileOnChange = (files?: FileItem[] | FileItem) => {
            if (!files || files.length === 0) {
                return;
            }
            const fields = Array.isArray(onChangePick)
                ? onChangePick
                : ["id", "name", "key", "src", "size", "type"];

            if (Array.isArray(files) === true) {
                const items = (files as FileItem[]).map(file => pick(file, fields));
                onChange(items as FileItem[]);
                return;
            }
            const file = pick(files as FileItem, fields);

            onChange(file as FileItem);
        };

        const props: FileManagerViewProps = {
            onChange:
                typeof onChange === "function"
                    ? handleFileOnChange
                    : () => {
                          return void 0;
                      },
            onClose,
            accept: accept as string[],
            multiple: multiple as boolean,
            maxSize: maxSize as string,
            multipleMaxCount: multipleMaxCount as number,
            multipleMaxSize: multipleMaxSize as number,
            onUploadCompletion,
            tags: tags,
            scope: scope,
            own: own
        };

        if (images) {
            props.accept = [
                "image/jpg",
                "image/jpeg",
                "image/tiff",
                "image/gif",
                "image/png",
                "image/webp",
                "image/bmp",
                "image/svg+xml"
            ];
        }

        // Let's pass "permanent" / "persistent" / "temporary" flags as "mode" prop instead.
        return ReactDOM.createPortal(
            <FileManagerProvider {...props}>
                <FileManagerView {...props} />
            </FileManagerProvider>,
            container
        );
    }
}

export const FileManager: React.FC<FileManagerProps> = ({ children, ...rest }) => {
    const [show, setShow] = useState(false);
    const onChangeRef = useRef(rest.onChange);

    useEffect(() => {
        onChangeRef.current = rest.onChange;
    }, [rest.onChange]);

    const showFileManager = useCallback(onChange => {
        if (typeof onChange === "function") {
            onChangeRef.current = onChange;
        }
        setShow(true);
    }, []);

    return (
        <>
            {show && (
                <FileManagerPortal
                    onClose={() => setShow(false)}
                    {...rest}
                    onChange={onChangeRef.current}
                />
            )}
            {children({ showFileManager })}
        </>
    );
};
