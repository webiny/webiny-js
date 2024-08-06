import styled from "@emotion/styled";

export const Dialog = styled.div`
    background-color: rgba(0, 0, 0, 0.32);
    height: 100%;
    width: 100%;
    position: fixed;
    z-index: 2312321;
    top: 0;

    .dialog {
        position: fixed;
        top: 350px;
        left: 50%;
        /* bring your own prefixes */
        transform: translate(-50%, -50%);
        background-color: white;
        width: 700px;
        height: 500px;
        z-index: auto;
        box-shadow:
            0px 11px 15px -7px rgba(0, 0, 0, 0.2),
            0px 24px 38px 3px rgba(0, 0, 0, 0.14),
            0px 9px 46px 8px rgba(0, 0, 0, 0.12);

        > ul {
            overflow-y: scroll;
            height: 444px;
            margin-bottom: 10px;

            > li {
                .section-title {
                    bottom-bottom: 1px solid var(--mdc-theme-on-background);
                    padding: 10px 15px 5px 15px;
                }

                ul {
                    li {
                        padding: 10px 15px;
                        cursor: pointer;

                        &.focused {
                            background-color: var(--mdc-theme-background);
                        }

                        .section-item-title {
                            margin-bottom: 3px;
                            color: var(--mdc-theme-primary);
                        }

                        .section-item-description {
                            color: var(--mdc-theme-text-primary-on-background);
                        }
                    }
                }
            }
        }
    }
`;
