import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { ImportModelData } from "~/admin/views/contentModels/importing/types";
import { DataListModelItemError } from "~/admin/views/contentModels/importing/components/Model/DataListModelItemError";
import { DataListModelItemInfo } from "./DataListModelItemInfo";
import { ToggleModelCb } from "~/admin/views/contentModels/importing/ImportContext";

const ContainerBase = styled("div")(() => {
    return {
        width: "100%",
        padding: "0px 5px 15px 5px",
        margin: "0",
        boxSizing: "border-box",
        "&:last-child": {
            paddingBottom: "2px"
        }
    };
});
const ContainerCreate = styled(ContainerBase)(() => {
    return {
        // backgroundColor: "var(--mdc-theme-secondary)"
    };
});
const ContainerImported = styled(ContainerBase)(() => {
    return {};
});
const ContainerUpdate = styled(ContainerBase)(() => {
    return {};
});
const ContainerError = styled(ContainerBase)(() => {
    return {};
});

const ModelContainer = styled("div")({
    display: "flex",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
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
    backgroundColor: "var(--mdc-theme-background)",
    "&.selected": {
        border: "1px solid var(--mdc-theme-secondary)"
    }
});

const ImportedText = styled("div")({
    padding: "1px 5px",
    textAlign: "right",
    display: "inline-block",
    border: "1px solid var(--mdc-theme-on-background)",
    fontSize: "10px",
    lineHeight: "12px",
    outline: "0 none",
    backgroundColor: "var(--mdc-theme-secondary)",
    color: "#FFF"
});

const Imported = () => {
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

const Checkbox = ({ model, toggle, selected }: CheckboxProps) => {
    const onClick = useCallback(() => {
        toggle(model);
    }, [toggle]);
    if (model.error) {
        return null;
    }
    return (
        <CheckboxContainer>
            <Button onClick={onClick} className={selected ? "selected" : ""}>
                {selected ? "Model will be imported" : "Model will be skipped"}
            </Button>
        </CheckboxContainer>
    );
};

interface ContainerProps {
    model: Pick<ImportModelData, "action" | "error" | "imported">;
    children: React.ReactNode;
}

const Container = ({ model, children }: ContainerProps) => {
    if (model.imported) {
        return <ContainerImported>{children}</ContainerImported>;
    } else if (model.action === "create") {
        return <ContainerCreate>{children}</ContainerCreate>;
    } else if (model.action === "update") {
        return <ContainerUpdate>{children}</ContainerUpdate>;
    } else if (model.error) {
        return <ContainerError>{children}</ContainerError>;
    }
    return <ContainerBase>{children}</ContainerBase>;
};

interface DataListModelItemProps {
    model: ImportModelData;
    toggle: ToggleModelCb;
    selected: boolean;
}

export const DataListModelItem = ({ model, toggle, selected }: DataListModelItemProps) => {
    return (
        <Container model={model}>
            <ModelContainer>
                <div>
                    <Name>{model.name || model.id}</Name>
                    {model.error ? (
                        <DataListModelItemError error={model.error} />
                    ) : (
                        <DataListModelItemInfo model={model} />
                    )}
                </div>
                {model.imported ? (
                    <Imported />
                ) : (
                    <Checkbox model={model} toggle={toggle} selected={selected} />
                )}
            </ModelContainer>
        </Container>
    );
};
