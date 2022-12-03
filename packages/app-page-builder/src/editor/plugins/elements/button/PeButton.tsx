import React, { useCallback, useRef } from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import SimpleEditableText from "~/editor/plugins/elements/button/SimpleEditableText";
import merge from "lodash/merge";
import set from "lodash/set";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import styled from "@emotion/styled";

interface ButtonProps {
    element: PbEditorElement;
    isActive?: boolean;
}

interface DefaultLinkComponentProps {
    href: string;
    newTab?: boolean;
}

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-button": any;
            "pb-button-body": any;
            "pb-button-container": any;
            "pb-button-icon": any;
            "pb-button-text": any;
        }
    }
}

const DefaultLinkComponent: React.FC<DefaultLinkComponentProps> = ({ href, newTab, children }) => {
    return (
        <a href={href} target={newTab ? "_blank" : "_self"} rel={"noreferrer"}>
            {children}
        </a>
    );
};

const DATA_NAMESPACE = "data.buttonText";

const Button: React.FC<ButtonProps> = props => {
    const eventActionHandler = useEventActionHandler();
    const LinkComponent = DefaultLinkComponent;

    const { getElementStyles, getThemeStyles } = usePageElements();

    const { element } = props;
    const { buttonText, link, type, icon } = element.data;

    const themeStyles = getThemeStyles(theme => {
        if (!theme.styles || !theme.styles.buttons) {
            return {};
        }

        return theme.styles.buttons[type];
    });

    const elementStyles = getElementStyles(element);

    const styles = [...themeStyles, ...elementStyles];
    const PbButton = styled(({ className, children }) => (
        <pb-button class={className}>{children}</pb-button>
    ))(styles);

    return (
        <PbButton>
            <LinkComponent {...link}>
                <pb-button-body>
                    {icon && <pb-button-icon dangerouslySetInnerHTML={{ __html: icon.svg }} />}
                    <pb-button-text>{buttonText}</pb-button-text>
                </pb-button-body>
            </LinkComponent>
        </PbButton>
    );

    // ---------------------------------------------------
    // const { element } = props;
    // const { buttonText, link, type, icon } = element.data;
    //
    // const themeClassNames = getThemeStyles(theme => {
    //     if (!theme.styles) {
    //         return {};
    //     }
    //
    //     const styles = { borderRadius: theme.styles.borderRadius };
    //     if (!theme.styles.buttons) {
    //         return styles;
    //     }
    //
    //     return { ...styles, ...theme.styles.buttons[type!] };
    // });
    //
    // const elementClassNames = getElementStyles(element as any);
    //
    // const classNames = combineClassNames(
    //     themeClassNames,
    //     elementClassNames,
    //     getStyles({
    //         padding: "14px 20px"
    //     })
    // );
    //
    // const containerStyles = getStyles({
    //     display: "flex"
    // });
    //
    // const defaultValue = typeof buttonText === "string" ? buttonText : "Click me";
    // const value = useRef<string>(defaultValue);
    // const onChange = useCallback(
    //     (received: string) => {
    //         value.current = received;
    //     },
    //     [element.id]
    // );
    //
    // const onBlur = useCallback(() => {
    //     if (value.current === defaultValue) {
    //         return;
    //     }
    //
    //     const newElement: PbEditorElement = merge(
    //         {},
    //         element,
    //         set({ elements: [] }, DATA_NAMESPACE, value.current)
    //     );
    //
    //     eventActionHandler.trigger(
    //         new UpdateElementActionEvent({
    //             element: newElement,
    //             history: true,
    //             debounce: false
    //         })
    //     );
    // }, [element.id, element.data]);
    //
    // const containerClassNames = getElementStyles(element as any);
    // const bodyClassNames = themeClassNames;
    // return (
    //     <pb-button>
    //         <LinkComponent {...link}>
    //             <pb-button-container class={containerClassNames}>
    //                 <pb-button-body class={bodyClassNames}>
    //                     {icon && <pb-button-icon dangerouslySetInnerHTML={{ __html: icon.svg }} />}
    //                     {props.isActive ? (
    //                         <SimpleEditableText
    //                             element={"pb-button-text"}
    //                             value={value.current}
    //                             onChange={onChange}
    //                             onBlur={onBlur}
    //                         />
    //                     ) : (
    //                         <pb-button-text>{buttonText}</pb-button-text>
    //                     )}
    //                 </pb-button-body>
    //             </pb-button-container>
    //         </LinkComponent>
    //     </pb-button>
    // );

    // return (
    //     <pb-heading>
    //         {props.isActive ? (
    //             <Text
    //                 tag={[tag, { className: classNames }]}
    //                 elementId={element.id}
    //                 mediumEditorOptions={getMediumEditorOptions(
    //                     DEFAULT_EDITOR_OPTIONS,
    //                     mediumEditorOptions
    //                 )}
    //             />
    //         ) : (
    //             React.createElement(tag, {
    //                 dangerouslySetInnerHTML: { __html: elementDataText.data?.text },
    //                 className: classNames
    //             })
    //         )}
    //     </pb-heading>
    // );

    // return (
    //     <ElementRoot className={"webiny-pb-base-page-element-style"} element={element}>
    //         {({ getAllClasses, elementStyle, elementAttributes }) => (
    //             <ButtonContainer
    //                 elementId={element.id}
    //                 getAllClasses={getAllClasses}
    //                 elementStyle={elementStyle}
    //                 elementAttributes={elementAttributes}
    //             />
    //         )}
    //     </ElementRoot>
    // );
};

export default Button;
