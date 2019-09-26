// @flow
import * as React from "react";
import { css } from "emotion";
import { sortable } from "react-sortable";
import { FileManager } from "@webiny/app-admin/components";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import File from "./File";

const style = {
    addImagesButton: css({ clear: "both", padding: "20px 10px", textAlign: "center" })
};

class Item extends React.Component {
    render() {
        return <li {...this.props}>{this.props.children}</li>;
    }
}

const SortableItem = sortable(Item);

const ImagesListImagesSettings = (props: Object) => {
    const { Bind, form } = props;
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"images"}>
                        {({ onChange, value }) => (
                            <FileManager
                                images
                                multiple
                                onChange={files => {
                                    Array.isArray(value)
                                        ? onChange([...value, ...files])
                                        : onChange([...files]);
                                }}
                            >
                                {({ showFileManager }) => (
                                    <>
                                        <ul className="sortable-list">
                                            {Array.isArray(value) &&
                                                value.map((item, i) => (
                                                    <SortableItem
                                                        key={i}
                                                        onSortItems={onChange}
                                                        items={value}
                                                        sortId={i}
                                                    >
                                                        <File
                                                            file={item}
                                                            onRemove={() =>
                                                                form.setState(state => {
                                                                    const next = {
                                                                        ...state
                                                                    };
                                                                    next.data.images.splice(i, 1);
                                                                    return next;
                                                                })
                                                            }
                                                        />
                                                    </SortableItem>
                                                ))}
                                        </ul>
                                        <div className={style.addImagesButton}>
                                            <ButtonPrimary onClick={showFileManager}>
                                                Add images...
                                            </ButtonPrimary>
                                        </div>
                                    </>
                                )}
                            </FileManager>
                        )}
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default ImagesListImagesSettings;
