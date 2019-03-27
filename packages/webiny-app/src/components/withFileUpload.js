// @flow
import * as React from "react";
import { compose, withHandlers } from "recompose";
import { withConfig } from "webiny-app/components";
import { getPlugin } from "webiny-plugins";
import invariant from "invariant";
import type { PluginType } from "webiny-plugins/types";
import { withSnackbar } from "webiny-admin/components";
import { graphql } from "react-apollo";
import gql from "graphql-tag";

type WithFileUploadOptions = {
    multiple?: boolean
};

type SelectedFile = Object & {
    src: string | File,
    name: string
};

export type WithFileUploadPlugin = PluginType & {
    type: string,
    upload: (file: SelectedFile, options: Object) => Promise<any>
};

const mustUpload = (file: SelectedFile) => {
    if (file && typeof file.src === "string") {
        const src: string = (file.src: any);
        return src.startsWith("data:");
    }

    return false;
};

const getFileUploader = () => {
    const withFileUploadPlugin = getPlugin("with-file-upload-uploader");

    invariant(
        withFileUploadPlugin,
        `"withFileUpload" component's uploader plugin (type "webiny-file-upload-uploader") not found.`
    );

    return file => {
        return withFileUploadPlugin.upload(file);
    };
};

const createFile = gql`
    mutation CreateFile($data: FileInput!) {
        files {
            createFile(data: $data) {
                data {
                    name
                }
            }
        }
    }
`;

export const withFileUpload = (options: WithFileUploadOptions = {}): Function => {
    return (BaseComponent: typeof React.Component) => {
        return compose(
            withSnackbar(),
            withConfig(),
            graphql(createFile, { name: "gqlCreateFile" }),
            withHandlers({
                uploadFile: props => async file => {
                    return getFileUploader()(file).then(uploadedFile => {
                        props.gqlCreateFile({ variables: { data: uploadedFile } });
                        return uploadedFile;
                    });
                },
                onChange: props => async file => {
                    const upload = getFileUploader();

                    const { onChange } = props;
                    onChange && (await onChange(file));

                    if (options.multiple) {
                        if (Array.isArray(file)) {
                            for (let index = 0; index < file.length; index++) {
                                let current = file[index];
                                if (mustUpload(current)) {
                                    file[index] = await upload(current);
                                    onChange && (await onChange(file));
                                }
                            }
                        }
                        return;
                    }

                    invariant(
                        !Array.isArray(file),
                        `Selected two or more files instead of one. Did you forget to set "multiple" option to true ("withFileUpload({multiple: true})")?`
                    );

                    if (mustUpload(file)) {
                        // Send file to server and get its path.
                        props.showSnackbar("Uploading...");
                        try {
                            return upload(file)
                                .then(async uploadedFile => {
                                    props.gqlCreateFile({ variables: { data: uploadedFile } });
                                    props.showSnackbar("File uploaded successfully.");
                                    onChange && (await onChange(uploadedFile));
                                })
                                .catch(async () => {
                                    props.showSnackbar("Ooops, something went wrong.");
                                    onChange && (await onChange(null));
                                });
                        } catch (e) {
                            // eslint-disable-next-line
                            console.warn(e);
                        }
                    }
                }
            })
        )(BaseComponent);
    };
};
