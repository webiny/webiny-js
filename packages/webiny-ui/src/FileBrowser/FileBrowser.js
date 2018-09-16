// @flow
import * as React from "react";
import bytes from "bytes";

export type FileBrowserFile = {
    name: string,
    type: string,
    size: number,
    src: File | string
};

export type FileError = {
    type: "unsupportedFileType" | "maxSizeExceeded",
    file: FileBrowserFile
};

export type BrowseFilesParams = {
    onSuccess: ?(files: Array<FileBrowserFile>) => any,
    onErrors: ?(errors: Array<FileError>) => any
};

export type RenderPropParams = {
    browseFiles: BrowseFilesParams => void
};

type Props = {
    children: RenderPropParams => React.Node,

    defaultSelectedFiles?: Array<Image>,

    // Which file types should be accepted?
    accept?: Array<string>,

    // Is selecting multiple files allowed?
    multiple?: boolean,

    // Maximum allowed file size.
    maxSize?: number | string,

    convertToBase64?: boolean
};

const readFileContent = async (file: File) => {
    return new Promise(resolve => {
        const reader = new window.FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };

        reader.readAsDataURL(file);
    });
};

class FileBrowser extends React.Component<Props> {
    static defaultProps = {
        accept: [],
        multiple: false,
        maxSize: "2mb",
        readAs: "data", // data || binary
        onChange: null,
        convertToBase64: false
    };

    input: Object = React.createRef();

    browseFilesPassedParams: ?BrowseFilesParams = null;

    processSelectedFiles = async (e: SyntheticInputEvent<HTMLInputElement>) => {
        const { accept, maxSize, convertToBase64 } = this.props;
        const files: Array<FileBrowserFile> = [...e.target.files].map((file: File) => {
            return {
                name: file.name,
                type: file.type,
                size: file.size,
                src: file
            };
        });

        if (files.length === 0) {
            return;
        }

        const errors: Array<FileError> = [];

        for (let index = 0; index < files.length; index++) {
            let file = files[index];

            if (Array.isArray(accept) && accept.length && accept.indexOf(file.type) === -1) {
                errors.push({
                    file,
                    type: "unsupportedFileType"
                });
            } else if (maxSize) {
                if (file.size > bytes(maxSize)) {
                    errors.push({
                        file,
                        type: "maxSizeExceeded"
                    });
                }
            }
        }

        const browseFilesPassedParams: BrowseFilesParams = (this.browseFilesPassedParams: any);
        if (errors.length) {
            if (browseFilesPassedParams.onErrors) {
                browseFilesPassedParams.onErrors(errors);
            }
        } else {
            if (convertToBase64) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const src: File = (file.src: any);
                    file.src = await readFileContent(src);
                }
            }

            if (browseFilesPassedParams.onSuccess) {
                browseFilesPassedParams.onSuccess(files);
            }
        }

        // Reset the browseFiles arguments.
        this.browseFilesPassedParams = null;
        this.input.value = "";
    };

    render() {
        const { multiple, accept } = this.props;
        return (
            <React.Fragment>
                {this.props.children({
                    browseFiles: params => {
                        this.browseFilesPassedParams = params;

                        // Opens the file browser.
                        this.input && this.input.click();
                    }
                })}
                <input
                    ref={ref => {
                        if (ref) {
                            this.input = ref;
                        }
                    }}
                    accept={accept}
                    style={{ display: "none" }}
                    type="file"
                    multiple={multiple}
                    onChange={this.processSelectedFiles}
                />
            </React.Fragment>
        );
    }
}

export { FileBrowser };
