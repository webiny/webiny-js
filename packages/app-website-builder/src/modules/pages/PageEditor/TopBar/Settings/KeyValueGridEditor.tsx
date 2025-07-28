import React, { useState } from "react";
import { Grid, Input, Button, IconButton, Text } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";

type KeyValue = {
    key: string;
    value: string;
};

export const KeyValueGridEditor: React.FC = () => {
    const [items, setItems] = useState<KeyValue[]>([]);

    const handleChange = (index: number, field: "key" | "value", value: string) => {
        const updated = [...items];
        updated[index][field] = value;
        setItems(updated);
    };

    const handleDelete = (index: number) => {
        const updated = items.filter((_, i) => i !== index);
        setItems(updated);
    };

    const handleAdd = () => {
        setItems([...items, { key: "", value: "" }]);
    };

    return (
        <Grid className={"wby-mt-md"}>
            <>
                <Grid.Column span={12}>
                    <Text size={"md"}>Add your SEO tags here.</Text>
                </Grid.Column>
                {items.map((item, index) => (
                    <Grid.Column key={index} span={12}>
                        <Grid>
                            <Grid.Column span={5}>
                                <Input
                                    placeholder="Key"
                                    value={item.key}
                                    onChange={value => handleChange(index, "key", value)}
                                />
                            </Grid.Column>
                            <Grid.Column span={5}>
                                <Input
                                    placeholder="Value"
                                    value={item.value}
                                    onChange={value => handleChange(index, "value", value)}
                                />
                            </Grid.Column>
                            <Grid.Column span={2}>
                                <IconButton
                                    size={"md"}
                                    variant={"tertiary"}
                                    onClick={() => handleDelete(index)}
                                    icon={<DeleteIcon />}
                                />
                            </Grid.Column>
                        </Grid>
                    </Grid.Column>
                ))}
            </>
            <Grid.Column span={12} key={"action"}>
                <Button onClick={handleAdd} variant={"secondary"} text={"+ Add"} />
            </Grid.Column>
        </Grid>
    );
};
