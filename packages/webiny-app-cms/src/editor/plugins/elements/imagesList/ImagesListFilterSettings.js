// @flow
import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { withCms } from "webiny-app-cms/context";
import { FileManager } from "webiny-admin/components";
import { Image } from "webiny-ui/ImageUpload";

const ImagesListFilterSettings = ({ Bind }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={6}>
                    <Bind name={"images"}>
                        {({ onChange, value }) => (
                            <FileManager onChange={onChange} images files={{ multiple: true }}>
                                {({ showFileManager }) => {
                                    if (Array.isArray(value) && value.length) {
                                        return value.map(image => {
                                            return (
                                                <Image
                                                    key={image.src}
                                                    value={image}
                                                    uploadImage={showFileManager}
                                                />
                                            );
                                        });
                                    }
                                    return <Image value={value} uploadImage={showFileManager} />;
                                }}
                            </FileManager>
                        )}
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default withCms()(ImagesListFilterSettings);
