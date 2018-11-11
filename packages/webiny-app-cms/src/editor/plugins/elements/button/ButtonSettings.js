import * as React from "react";
import { getPlugins } from "webiny-app/plugins";
import { Select } from "webiny-ui/Select";
import { Input } from "webiny-ui/Input";
import { Switch } from "webiny-ui/Switch";
import { Grid, Cell } from "webiny-ui/Grid";
import IconPicker from "webiny-app-cms/editor/components/IconPicker";
import { get } from "dot-prop-immutable";

let icons;
const getIcons = () => {
    if (!icons) {
        icons = getPlugins("cms-icons").reduce((icons: Array<Object>, pl: Object) => {
            return icons.concat(pl.getIcons());
        }, []);
        window.icons = icons;
    }
    return icons;
};

const getSvg = (name, width = 24) => {
    const svg = getIcons().find(ic => ic.id === name).svg;
    return svg.replace(`width="24"`, `width="${width}"`);
};

const ButtonSettings = ({ Bind, theme }) => {
    const { types } = theme.elements.button;

    const preview = (
        <Bind name={"data.icon"}>
            {({ value }) => <span dangerouslySetInnerHTML={{ __html: value }} />}
        </Bind>
    );

    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"settings.advanced.type"} defaultValue={""}>
                        <Select description={"Button type"}>
                            {types.map(type => (
                                <option key={type.className} value={type.className}>
                                    {type.label}
                                </option>
                            ))}
                        </Select>
                    </Bind>
                </Cell>
            </Grid>
            <Grid>
                <Cell span={12}>
                    <Bind name={"settings.advanced.href"} defaultValue={""} validators={["url"]}>
                        <Input description={"On click, go to this URL."} />
                    </Bind>
                </Cell>
            </Grid>
            <Grid>
                <Cell span={12}>
                    <Bind name={"settings.advanced.newTab"} defaultValue={false}>
                        <Switch description={"New tab"} />
                    </Bind>
                </Cell>
            </Grid>
            <Grid>
                <Bind name={"data.icon"} defaultValue={""}>
                    {({ onChange: setIcon }) => (
                        <Bind
                            name={"settings.advanced.icon"}
                            defaultValue={""}
                            beforeChange={(value, cb) => {
                                cb(value);
                                setIcon(getSvg(value, 24));
                            }}
                        >
                            {({ value, onChange }) => (
                                <React.Fragment>
                                    <Cell span={6}>
                                        <IconPicker
                                            label={"Icon"}
                                            value={value}
                                            onChange={onChange}
                                        />
                                    </Cell>
                                    <Cell span={4}>
                                        <Bind
                                            name={"settings.advanced.width"}
                                            defaultValue={"24"}
                                            validators={["number", "gt:0"]}
                                            beforeChange={(width, cb) => {
                                                cb(width);
                                                setIcon(getSvg(value, width));
                                            }}
                                        >
                                            <Input label={"Icon size"} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={2}>{preview}</Cell>
                                </React.Fragment>
                            )}
                        </Bind>
                    )}
                </Bind>
            </Grid>
        </React.Fragment>
    );
};

export default ButtonSettings;
