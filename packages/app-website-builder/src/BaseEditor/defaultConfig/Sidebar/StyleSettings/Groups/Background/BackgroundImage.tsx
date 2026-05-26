import React, { useEffect, useState, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { FileManager, type FileManagerFileItem } from "@webiny/app-admin";
import { FilePicker } from "@webiny/admin-ui";
import { useStyles } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/useStyles.js";
import { BackgroundImageParser } from "./BackgroundImageParser.js";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import { InheritanceLabel } from "../../../InheritanceLabel.js";
import { SidebarRow } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/SidebarRow.js";

type FileInfo = {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
};

const DEFAULT_POSITION = "center";
const DEFAULT_SCALING = {
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat"
};

export const parseValue = (value: string) => {
    if (!value) {
        return undefined;
    }

    return;
};

export const BackgroundImage = observer(({ elementId }: { elementId: string }) => {
    const { isBaseBreakpoint } = useBreakpoint();
    const { styles, metadata, onChange, inheritanceMap } = useStyles(elementId);
    const [localValue, setLocalValue] = useState<string | null>(styles.backgroundImage);
    const url = useMemo(() => {
        const parser = new BackgroundImageParser(styles.backgroundImage);
        const rules = parser.getRules();
        const urlRule = rules.find(r => r.type === "url");
        if (urlRule && urlRule.type === "url") {
            return urlRule.parsed.url;
        }
        return null;
    }, [styles.backgroundImage]);

    useEffect(() => {
        if (styles.backgroundImage !== localValue) {
            setLocalValue(styles.backgroundImage);
        }
    }, [styles.backgroundImage]);

    const onFileChange = (file: FileManagerFileItem) => {
        onChange(({ styles, metadata }) => {
            styles.set("backgroundPosition", DEFAULT_POSITION);
            styles.set("backgroundSize", DEFAULT_SCALING.backgroundSize);
            styles.set("backgroundRepeat", DEFAULT_SCALING.backgroundRepeat);
            styles.set("backgroundImage", `url("${file.src}")`);

            metadata.set("backgroundImage", {
                id: file.id,
                name: file.name,
                size: file.size,
                type: file.type,
                url: file.src || ""
            });
        });
    };

    const onRemove = () => {
        onChange(({ styles, metadata }) => {
            // On base breakpoint, we unset the image and all styles related to it.
            if (isBaseBreakpoint) {
                styles.unset("backgroundImage");
                styles.unset("backgroundPosition");
                styles.unset("backgroundSize");
                styles.unset("backgroundRepeat");
            } else {
                styles.set("backgroundImage", "none");
            }

            metadata.unset("backgroundImage");
        });
    };

    const onReset = () => {
        onChange(({ styles }) => {
            styles.unset("backgroundImage");

            metadata.unset("backgroundImage");
        });
    };

    const inheritance = inheritanceMap?.backgroundImage ?? {};

    const fileInfo = metadata.get<FileInfo>("backgroundImage");

    return (
        <SidebarRow
            label={
                <InheritanceLabel
                    onReset={onReset}
                    isOverridden={inheritance?.overridden ?? false}
                    inheritedFrom={inheritance?.inheritedFrom}
                    text={"Image"}
                />
            }
        >
            <FileManager
                images={true}
                onChange={onFileChange}
                render={({ showFileManager }) => (
                    <FilePicker
                        variant={"secondary"}
                        type="compact"
                        value={url ? fileInfo : undefined}
                        onSelectItem={() => showFileManager()}
                        onRemoveItem={onRemove}
                        onEditItem={() => showFileManager()}
                    />
                )}
            />
        </SidebarRow>
    );
});
