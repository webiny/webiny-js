import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { AsyncProperties, Await, Property, toObject } from "~/index";
import { getLastCall, flush } from "./utils";

async function flushAsync() {
    await flush();
    await flush();
}

function createDeferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (err: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe("Await", () => {
    it("should wait for async properties before calling onChange", async () => {
        const onChange = vi.fn();
        const deferred = createDeferred<string>();

        render(
            <AsyncProperties onChange={onChange}>
                <Property name="sync" value="yes" root />
                <Await fn={() => deferred.promise}>
                    {val => <Property name="async" value={val} root />}
                </Await>
            </AsyncProperties>
        );

        await flush();
        expect(onChange).not.toHaveBeenCalled();

        deferred.resolve("resolved");
        await flushAsync();

        expect(onChange).toHaveBeenCalled();
        const obj = toObject(getLastCall(onChange));
        expect(obj).toEqual({ sync: "yes", async: "resolved" });
    });

    it("should handle multiple Await components", async () => {
        const onChange = vi.fn();
        const d1 = createDeferred<string>();
        const d2 = createDeferred<string>();

        render(
            <AsyncProperties onChange={onChange}>
                <Await fn={() => d1.promise}>
                    {val => <Property name="first" value={val} root />}
                </Await>
                <Await fn={() => d2.promise}>
                    {val => <Property name="second" value={val} root />}
                </Await>
            </AsyncProperties>
        );

        await flush();
        expect(onChange).not.toHaveBeenCalled();

        d1.resolve("one");
        await flushAsync();
        expect(onChange).not.toHaveBeenCalled();

        d2.resolve("two");
        await flushAsync();

        expect(onChange).toHaveBeenCalled();
        const obj = toObject(getLastCall(onChange));
        expect(obj).toEqual({ first: "one", second: "two" });
    });

    it("should handle nested Await components", async () => {
        const onChange = vi.fn();
        const outer = createDeferred<string>();
        const inner = createDeferred<string>();

        render(
            <AsyncProperties onChange={onChange}>
                <Await fn={() => outer.promise}>
                    {outerVal => (
                        <>
                            <Property name="outer" value={outerVal} root />
                            <Await fn={() => inner.promise}>
                                {innerVal => <Property name="inner" value={innerVal} root />}
                            </Await>
                        </>
                    )}
                </Await>
            </AsyncProperties>
        );

        await flush();
        expect(onChange).not.toHaveBeenCalled();

        outer.resolve("outerValue");
        await flushAsync();
        expect(onChange).not.toHaveBeenCalled();

        inner.resolve("innerValue");
        await flushAsync();

        expect(onChange).toHaveBeenCalled();
        const obj = toObject(getLastCall(onChange));
        expect(obj).toEqual({ outer: "outerValue", inner: "innerValue" });
    });

    it("should work without async properties (backward compat)", async () => {
        const onChange = vi.fn();

        render(
            <AsyncProperties onChange={onChange}>
                <Property name="a" value="1" root />
                <Property name="b" value="2" root />
            </AsyncProperties>
        );

        await flush();

        expect(onChange).toHaveBeenCalled();
        const obj = toObject(getLastCall(onChange));
        expect(obj).toEqual({ a: "1", b: "2" });
    });

    it("should fire onChange even when Await children render no properties", async () => {
        const onChange = vi.fn();
        const deferred = createDeferred<string>();

        render(
            <AsyncProperties onChange={onChange}>
                <Property name="sync" value="yes" root />
                <Await fn={() => deferred.promise}>{() => null}</Await>
            </AsyncProperties>
        );

        await flush();
        expect(onChange).not.toHaveBeenCalled();

        deferred.resolve("done");
        await flushAsync();

        expect(onChange).toHaveBeenCalled();
        const obj = toObject(getLastCall(onChange));
        expect(obj).toEqual({ sync: "yes" });
    });

    it("should handle promise rejection", async () => {
        const onChange = vi.fn();
        const deferred = createDeferred<string>();

        render(
            <AsyncProperties onChange={onChange}>
                <Property name="sync" value="yes" root />
                <Await fn={() => deferred.promise}>
                    {val => <Property name="async" value={val} root />}
                </Await>
            </AsyncProperties>
        );

        await flush();
        expect(onChange).not.toHaveBeenCalled();

        deferred.reject(new Error("test error"));
        await flushAsync();

        expect(onChange).toHaveBeenCalled();
        const obj = toObject(getLastCall(onChange));
        expect(obj).toEqual({ sync: "yes" });
    });
});
