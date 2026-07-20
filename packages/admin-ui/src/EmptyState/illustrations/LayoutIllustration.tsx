import React from "react";

export const LayoutIllustration = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 145 120" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <g>
            <g>
                <g>
                    <g filter="url(#es_layout_filter0_d_6795_48832)">
                        <path
                            d="M9.83984 16.4212C9.83984 12.0029 13.4216 8.42117 17.8398 8.42117H126.84C131.258 8.42117 134.84 12.0029 134.84 16.4212V100.421C134.84 104.839 131.258 108.421 126.84 108.421H17.8398C13.4216 108.421 9.83984 104.839 9.83984 100.421V16.4212Z"
                            fill="white"
                        />
                    </g>
                    <ellipse cx="20.7853" cy="18.8145" rx="2.47525" ry="2.5" fill="#FA5723" />
                    <ellipse cx="28.8302" cy="18.8145" rx="2.47525" ry="2.5" fill="#FA5723" />
                    <ellipse cx="37.4938" cy="18.8145" rx="2.47525" ry="2.5" fill="#FA5723" />
                </g>
                <rect
                    x="21.1948"
                    y="32.3548"
                    width="33.4252"
                    height="64.5089"
                    rx="1.9666"
                    fill="#F0F1F3"
                />
                <rect
                    x="60.4556"
                    y="32.3548"
                    width="62.8968"
                    height="30.1364"
                    rx="1.9666"
                    fill="#F0F1F3"
                />
                <rect
                    x="60.4556"
                    y="67.1904"
                    width="29.1788"
                    height="29.6732"
                    rx="1.9666"
                    fill="#F0F1F3"
                />
                <rect
                    x="94.1738"
                    y="67.1904"
                    width="29.1788"
                    height="29.6732"
                    rx="1.9666"
                    fill="#F0F1F3"
                />
            </g>
        </g>
        <defs>
            <filter
                id="es_layout_filter0_d_6795_48832"
                x="-0.000156403"
                y="8.9407e-06"
                width="144.68"
                height="119.68"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
            >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                />
                <feOffset dy="1.41884" />
                <feGaussianBlur stdDeviation="4.92" />
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
                <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_6795_48832"
                />
                <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_6795_48832"
                    result="shape"
                />
            </filter>
        </defs>
    </svg>
);
