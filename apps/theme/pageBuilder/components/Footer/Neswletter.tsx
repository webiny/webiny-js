import React, { useCallback, useState } from "react";
import styled from "@emotion/styled";

import emailIcon from "./assets/email-icon.svg";
import newsletterBullet from "./assets/newsletter-bullet.svg";

const Title = styled.label`
    font-size: 24px;
    color: white;
    font-weight: 700;
    margin-top: 0;
    line-height: 150%;
    text-align: right;
    width: 100%;
    display: inline-block;
`;

const InputWrapper = styled("form")({
    position: "relative",
    minWidth: 320,

    ".webiny-pb-media-query--mobile-landscape &": {
        minWidth: "100%"
    },
    ".webiny-pb-media-query--mobile-portrait &": {
        minWidth: "100%"
    }
});

const Input = styled("input")({
    background: "var(--webiny-theme-color-surface)",
    border: "1px solid #979797",
    borderRadius: 8,
    fontSize: 18,
    padding: "15px 25px 15px 50px",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",

    ".webiny-pb-media-query--mobile-landscape &": {
        fontSize: 14
    },
    ".webiny-pb-media-query--mobile-portrait &": {
        fontSize: 14
    }
});

const Submit = styled("button")({
    background: "#282C34",
    borderRadius: 8,
    position: "absolute",
    color: "var(--webiny-theme-color-white)",
    textTransform: "uppercase",
    padding: "5px 20px",
    fontWeight: 600,
    fontSize: 14,
    right: 15,
    top: 12,
    outline: "none"
});

const EmailIcon = styled("img")({
    position: "absolute",
    left: 15,
    top: "calc(50% - 7px)"
});

const NlReasons = styled("ul")({
    margin: 0,
    paddingTop: 15
});

const NlReason = styled("li")({
    listStyle: "none",
    listStylePosition: "outside",
    backgroundImage: "url(" + newsletterBullet + ")",
    backgroundPosition: "right 0 center",
    backgroundRepeat: "no-repeat",
    paddingRight: 25,
    fontSize: 14,
    lineHeight: "32px",
    marginBottom: 5,
    textAlign: "right"
});

const Newsletter = () => {
    const [email, setEmail] = useState<string>("");
    const [done, markDone] = useState<boolean>(false);

    const handleSubmit = useCallback(
        event => {
            event.preventDefault();

            if (email.trim().length === 0) {
                return;
            }

            setEmail("Thanks! You're on the list. 🚀");
            markDone(true);

            fetch(
                "https://app.mailerlite.com/webforms/submit/g9f1i1?fields%5Bemail%5D=" +
                    encodeURIComponent(email) +
                    "&ml-submit=1&ajax=1",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }
            );
        },
        [email]
    );

    return (
        <React.Fragment>
            <Title htmlFor="newsletter_email">Join Webiny Newsletter</Title>
            <InputWrapper
                action="https://app.mailerlite.com/webforms/landing/g9f1i1"
                data-code="g9f1i1"
                method="get"
                target="_blank"
            >
                <Input
                    placeholder="email@domain.com"
                    type="email"
                    onChange={({ target: { value } }) => setEmail(value)}
                    value={email}
                    name="fields[email]"
                    id="newsletter_email"
                    required
                />
                <EmailIcon alt="Email" src={emailIcon} />
                {!done && <Submit onClick={handleSubmit}>Join</Submit>}
            </InputWrapper>
            <NlReasons className="webiny-nl-reason-list">
                <NlReason>We send one newsletter a week.</NlReason>
                <NlReason>Contains only Webiny relevant content.</NlReason>
                <NlReason>Your email is not shared with any 3rd parties.</NlReason>
            </NlReasons>
        </React.Fragment>
    );
};

export default Newsletter;
