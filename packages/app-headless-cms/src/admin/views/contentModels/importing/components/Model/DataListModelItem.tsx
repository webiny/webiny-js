import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { ImportModelData } from "~/admin/views/contentModels/importing/types";
import { DataListModelItemError } from "~/admin/views/contentModels/importing/components/Model/DataListModelItemError";
import { DataListModelItemInfo } from "./DataListModelItemInfo";
import { ToggleModelCb } from "~/admin/views/contentModels/importing/ImportContext";

const ContainerBase = styled("div")(({ selected }: any) => {
    return {
        width: "100%",
        padding: "2px 5px 0 5px",
        margin: "0",
        boxSizing: "border-box",
        backgroundColor: selected ? "yellow" : "transparent"
    };
});
const ContainerCreate = styled(ContainerBase)(() => {
    return {
        // backgroundColor: "var(--mdc-theme-secondary)"
    };
});
const ContainerImported = styled(ContainerBase)(() => {
    return {
        backgroundColor: "var(--mdc-theme-secondary)"
    };
});
const ContainerUpdate = styled(ContainerBase)(() => {
    return {
        // backgroundColor: "var(--mdc-theme-background)"
    };
});
const ContainerError = styled(ContainerBase)(() => {
    return {
        // backgroundColor: "red"
    };
});

const ModelContainer = styled("div")({
    display: "flex",
    width: "100%",
    flexDirection: "row",
    verticalAlign: "middle"
});
const Name = styled("h4")({
    fontSize: "12px",
    flex: "1 0 auto",
    lineHeight: "18px"
});
const CheckboxContainer = styled("div")({
    width: "120px",
    textAlign: "right",
    verticalAlign: "middle"
});

const Button = styled("button")({
    padding: "1px 5px",
    textAlign: "right",
    display: "inline-block",
    border: "1px solid var(--mdc-theme-on-background)",
    fontSize: "10px",
    lineHeight: "12px",
    cursor: "pointer",
    outline: "0 none",
    backgroundColor: "var(--mdc-theme-background)"
});

const ImportedText = styled("div")({
    padding: "1px 5px",
    textAlign: "right",
    display: "inline-block",
    border: "1px solid var(--mdc-theme-on-background)",
    fontSize: "10px",
    lineHeight: "12px",
    outline: "0 none",
    backgroundColor: "var(--mdc-theme-background)"
});

const Imported: React.VFC = () => {
    return (
        <CheckboxContainer>
            <ImportedText>Imported.</ImportedText>
        </CheckboxContainer>
    );
};

interface CheckboxProps {
    model: Pick<ImportModelData, "id" | "name" | "error" | "related">;
    toggle: ToggleModelCb;
    selected: boolean;
}

const Checkbox: React.VFC<CheckboxProps> = ({ model, toggle, selected }) => {
    const onClick = useCallback(() => {
        toggle(model);
    }, [toggle]);
    if (model.error) {
        return null;
    }
    return (
        <CheckboxContainer>
            <Button onClick={onClick}>
                {selected ? "Exclude from import" : "Include in import"}
            </Button>
        </CheckboxContainer>
    );
};

interface ContainerProps {
    model: Pick<ImportModelData, "action" | "error" | "imported">;
    selected: boolean;
}

const Container: React.VFC<React.PropsWithChildren<ContainerProps>> = ({
    model,
    selected,
    children
}) => {
    if (model.imported) {
        return <ContainerImported>{children}</ContainerImported>;
    } else if (model.action === "create") {
        return <ContainerCreate selected={selected}>{children}</ContainerCreate>;
    } else if (model.action === "update") {
        return <ContainerUpdate selected={selected}>{children}</ContainerUpdate>;
    } else if (model.error) {
        return <ContainerError>{children}</ContainerError>;
    }
    return <ContainerBase>{children}</ContainerBase>;
};

interface Props {
    model: ImportModelData;
    toggle: ToggleModelCb;
    selected: boolean;
}

export const DataListModelItem: React.VFC<Props> = ({ model, toggle, selected }) => {
    return (
        <Container model={model} selected={selected}>
            <ModelContainer>
                <Name>{model.name || model.id}</Name>
                {model.imported ? (
                    <Imported />
                ) : (
                    <Checkbox model={model} toggle={toggle} selected={selected} />
                )}
            </ModelContainer>
            {model.error ? (
                <DataListModelItemError error={model.error} />
            ) : (
                <DataListModelItemInfo model={model} />
            )}
        </Container>
    );
};
