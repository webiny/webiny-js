import React from "react";
import { Input } from "../index";
import "jest-dom/extend-expect";
import { render, cleanup } from "react-testing-library";

afterEach(cleanup);

describe("Input tests", () => {
    test("passes expected props to render prop", () => {
        const { renderArg } = setup();

        expect(renderArg).toContainKeys(["value", "validation", "onChange", "onBlur"]);
    });

    test("updates value via onChange", () => {
        const { renderArg } = setup();
        expect(renderArg.value).toBe("init-value");
        renderArg.onChange("new-value");
        expect(renderArg.value).toBe("new-value");
        renderArg.onChange("third-value");
        expect(renderArg.value).toBe("third-value");
    });
});

function setup(props = {}) {
    let renderArg = {};
    const renderProp = jest.fn(controllerArg => {
        Object.assign(renderArg, controllerArg);
        return null;
    });

    class Test extends React.Component {
        state = { value: "init-value" };

        onChange = value => {
            this.setState({ value });
        };

        render() {
            return (
                <Input
                    {...props}
                    value={this.state.value}
                    onChange={callAll(props.onChange, this.onChange)}
                >
                    {renderProp}
                </Input>
            );
        }
    }

    const utils = render(<Test />);

    return { renderArg, ...utils };
}

/**
 * This return a function that will call all the given functions with
 * the arguments with which it's called. It does a null-check before
 * attempting to call the functions and can take any number of functions.
 * @param {...Function} fns the functions to call
 * @return {Function} the function that calls all the functions
 */
function callAll(...fns) {
    return (...args) => {
        fns.forEach(fn => {
            fn && fn(...args);
        });
    };
}
