import React, { useEffect, Dispatch, SetStateAction, useCallback, useRef } from "react";
import styled from "@emotion/styled";
import { CmsModel } from "~/types";
import { useEntries } from "~/admin/plugins/fieldRenderers/ref/advanced/hooks/useEntries";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { ReactComponent as SearchIcon } from "./assets/search.svg";

const Container = styled("div")({
    display: "flex",
    width: "100%",
    position: "relative",
    height: "36px",
    marginBottom: "16px"
});

const Icon = styled(SearchIcon)({
    position: "absolute",
    top: "6px",
    left: "16px",
    width: "24px",
    height: "24px"
});

const Input = styled("input")({
    display: "block",
    boxSizing: "border-box",
    border: "1px solid var(--mdc-theme-on-background)",
    backgroundColor: "var(--mdc-theme-background)",
    width: "100%",
    height: "100%",
    fontSize: "14px",
    lineHeight: "36px",
    paddingLeft: "46px",
    ":focus-visible": {
        outline: "none"
    }
});

interface Props {
    model: CmsModel;
    setEntries: Dispatch<SetStateAction<CmsReferenceContentEntry[]>>;
    setError: Dispatch<SetStateAction<string | null>>;
    setLoading: Dispatch<SetStateAction<boolean>>;
}
export const Search: React.VFC<Props> = ({ model, setEntries, setLoading, setError }) => {
    const { entries, loading, error, runSearch } = useEntries({
        model
    });

    const debouncedSearch = useRef<number | null>(null);

    const onInput = useCallback(ev => {
        const value = (String(ev.target.value) || "").trim();
        if (debouncedSearch.current) {
            clearTimeout(debouncedSearch.current);
            debouncedSearch.current = null;
        }
        /**
         * We can safely cast as setTimeout really produces a number.
         * There is an error while coding because Storm thinks this is NodeJS timeout.
         */
        debouncedSearch.current = setTimeout(() => {
            runSearch(value);
        }, 200) as unknown as number;
    }, []);

    useEffect(() => {
        setError(error);
        setLoading(loading);
        setEntries(entries || []);
    }, [entries, loading, error]);

    useEffect(() => {
        runSearch("");
    }, []);

    return (
        <Container>
            <Icon />
            <Input placeholder={"Search entries"} onKeyUp={onInput} />
        </Container>
    );
};
