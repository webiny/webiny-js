import { defineStyleConfig } from "@chakra-ui/react";

export const buttonTheme = defineStyleConfig({
    // The styles all button have in common
    baseStyle: {
        borderRadius: "base",
        fontSize: "sm",
        fontWeight: "normal",
        border: "1px solid",
        _focusVisible: {
            boxShadow: "0px 0px 0px 4px rgba(250, 87, 35, 0.28)",
            borderColor: "brand.500"
        }
    },
    // Four sizes: sm, md, lg and xl
    sizes: {
        sm: {
            fontSize: "xs",
            lineHeight: "none",
            h: 6,
            px: 2,
            py: 1
        },
        md: {
            fontSize: "sm",
            h: 8,
            px: 3,
            py: 2
        },
        lg: {
            fontSize: "sm",
            fontWeight: "semibold",
            h: 10,
            px: 4,
            py: 2.5,
            borderRadius: "lg"
        },
        xl: {
            fontSize: "md",
            fontWeight: "semibold",
            h: 12,
            px: 5,
            py: 3.5,
            borderRadius: "lg"
        }
    },
    // Four sizes: primary, secondary, outline and link
    variants: {
        primary: {
            bg: "brand.500",
            color: "white",
            _hover: {
                bg: "brand.700",
                _disabled: {
                    bg: "brand.300"
                }
            },
            _active: {
                bg: "brand.700",
                _disabled: {
                    bg: "brand.300"
                }
            },
            _disabled: {
                bg: "brand.300"
            }
        },
        secondary: {
            bg: "gray.200",
            borderColor: "gray.200",
            color: "black",
            _hover: {
                bg: "gray.300",
                borderColor: "gray.300",
                color: "gray.800",
                _disabled: {
                    bg: "gray.200",
                    color: "gray.900"
                },
                _focusVisible: {
                    borderColor: "brand.500"
                }
            },
            _active: {
                bg: "gray.300",
                borderColor: "gray.300",
                color: "gray.800",
                _disabled: {
                    bg: "gray.200",
                    borderColor: "gray.200",
                    color: "gray.900"
                }
            },
            _disabled: {
                bg: "gray.200",
                borderColor: "gray.200",
                color: "gray.900"
            }
        },
        outline: {
            bg: "white",
            color: "gray.900",
            borderColor: "gray.400",
            _hover: {
                bg: "gray.100",
                color: "gray.900",
                _disabled: {
                    bg: "white",
                    borderColor: "gray.300",
                    color: "gray.900"
                }
            },
            _active: {
                bg: "gray.400",
                borderColor: "gray.400",
                color: "gray.900",
                _disabled: {
                    bg: "white",
                    borderColor: "gray.300",
                    color: "gray.900"
                }
            },
            _disabled: {
                bg: "white",
                borderColor: "gray.300",
                color: "gray.900"
            }
        },
        ghost: {
            bg: "transparent",
            borderColor: "transparent",
            color: "gray.900",
            _hover: {
                bg: "gray.200",
                color: "gray.900",
                _disabled: {
                    bg: "white",
                    color: "gray.900"
                }
            },
            _active: {
                bg: "gray.300",
                color: "gray.900",
                _disabled: {
                    bg: "white",
                    color: "gray.900"
                }
            },
            _disabled: {
                bg: "white",
                color: "gray.900"
            }
        }
    },
    // The default size and variant values
    defaultProps: {
        size: "md",
        variant: "primary"
    }
});
