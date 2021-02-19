import React, { useReducer, useCallback, useEffect } from "react";
import { css } from "emotion";
import isHotkey from "is-hotkey";
import InputField from "../../elementSettings/components/InputField";

const containerClass = css({
    position: "relative"
});

const menuClass = css({
    position: "absolute",
    zIndex: 10,
    backgroundColor: "#ffffff",
    top: 31,
    display: "block",
    height: "auto",
    border: "1px solid var(--mdc-theme-on-background)",
    width: "100%",
    boxSizing: "border-box",
    li: {
        cursor: "pointer",
        padding: 8
    }
});

const activeClass = css({
    backgroundColor: "var(--mdc-theme-secondary)",
    color: "var(--mdc-theme-on-secondary)"
});

const getItems = (options = [], value) => {
    if (!value) {
        return options.map(item => ({
            label: item.key,
            value: item.key,
            isLast: item.children.length === 0
        }));
    }

    const parts = value.split(".");
    const items = [];
    let prefix = "";
    while (parts.length > 0) {
        const key = parts.shift();

        // Try finding the exact key
        const item = options.find(p => p.key === key);

        if (!item) {
            options
                .filter(v => v.key.startsWith(key))
                .forEach(item => {
                    items.push({
                        label: item.key,
                        value: prefix + item.key,
                        isLast: item.children.length === 0
                    });
                });
            break;
        }

        // Exact key
        if (!parts.length) {
            if (item.children.length === 0) {
                break;
            }

            items.push({
                label: item.key,
                value: prefix + item.key,
                isLast: item.children.length === 0
            });
        }

        prefix = prefix + item.key + ".";
        options = item.children;
    }

    return items;
};

export const HintInput = props => {
    const { options, value, onChange, description, placeholder } = props;

    const [state, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        menuOpened: false,
        selected: -1
    });

    const inputRef = React.createRef<HTMLInputElement>();

    const enteredMenu = useCallback(() => {
        setState({ overMenu: true });
    }, []);

    const leftMenu = useCallback(() => {
        setState({ overMenu: false });
    }, []);

    const focusInput = () => {
        inputRef.current.focus();
    };

    const items = getItems(options, value);

    useEffect(() => {
        setState({ selected: -1 });
    }, [value]);

    const onKeyDown = e => {
        if (!items.length) {
            return;
        }

        const index = state.selected;

        switch (true) {
            case isHotkey("up", { byKey: true })(e):
                e.preventDefault();
                setState({ selected: index === 0 ? 0 : index - 1 });
                break;
            case isHotkey("down", { byKey: true })(e):
                e.preventDefault();
                const length = items.length - 1;
                setState({ selected: index === length ? length : index + 1 });
                break;
            case isHotkey("esc", { byKey: true })(e):
                e.preventDefault();
                setState({ menuOpened: false });
                break;
            case isHotkey("mod+space", { byKey: true })(e):
                e.preventDefault();
                setState({ menuOpened: true });
                break;
            case isHotkey("enter", { byKey: true })(e):
                e.preventDefault();
                const item = items[index];
                onChange(item.isLast ? item.value : item.value + ".");
                break;
            default:
                break;
        }
    };

    return (
        <div className={containerClass}>
            <InputField
                ref={inputRef}
                description={description}
                placeholder={placeholder}
                value={value}
                onKeyDown={onKeyDown}
                onChange={onChange}
                onFocus={() => setState({ menuOpened: true })}
                onBlur={() => {
                    if (state.overMenu) {
                        return;
                    }
                    setState({ menuOpened: false });
                }}
            />
            {state.menuOpened && (
                <ul className={menuClass} onMouseEnter={enteredMenu} onMouseLeave={leftMenu}>
                    {items.map((item, index) => (
                        <li
                            className={index === state.selected ? activeClass : null}
                            key={index}
                            onMouseOver={() => setState({ selected: index })}
                            onClick={() => {
                                onChange(item.isLast ? item.value : item.value + ".");
                                focusInput();
                            }}
                        >
                            {item.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
