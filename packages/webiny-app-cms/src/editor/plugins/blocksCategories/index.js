// @flow
import React from "react";
import type { CmsBlockCategoryPluginType } from "webiny-app-cms/types";
import { ReactComponent as GeneralIcon } from "./icons/round-gesture-24px.svg";
import { ReactComponent as CtaIcon } from "./icons/round-notifications_active-24px.svg";
import { ReactComponent as ContentIcon } from "./icons/round-view_quilt-24px.svg";
import { ReactComponent as FeaturesIcon } from "./icons/round-stars-24px.svg";
import { ReactComponent as HeaderIcon } from "./icons/round-home-24px.svg";
import { ReactComponent as TeamIcon } from "./icons/round-group_work-24px.svg";
import { ReactComponent as TestimonialIcon } from "./icons/round-record_voice_over-24px.svg";

export default ([
    {
        type: "pb-editor-block-category",
        name: "pb-editor-block-category-cta",
        title: "Call To Action",
        description: "Call to action blocks.",
        icon: <CtaIcon />
    },
    {
        type: "pb-editor-block-category",
        name: "pb-editor-block-category-content",
        title: "Content",
        description: "Pre-formatted content blocks.",
        icon: <ContentIcon />
    },
    {
        type: "pb-editor-block-category",
        name: "pb-editor-block-category-features",
        title: "Features",
        description: "Blocks for listing features and benefits.",
        icon: <FeaturesIcon />
    },
    {
        type: "pb-editor-block-category",
        name: "pb-editor-block-category-general",
        title: "General",
        description: "List of general purpose blocks.",
        icon: <GeneralIcon />
    },
    {
        type: "pb-editor-block-category",
        name: "pb-editor-block-category-header",
        title: "Headers",
        description: "Page headers.",
        icon: <HeaderIcon />
    },
    {
        type: "pb-editor-block-category",
        name: "pb-editor-block-category-team",
        title: "Team",
        description: "Blocks to list out your team members.",
        icon: <TeamIcon />
    },
    {
        type: "pb-editor-block-category",
        name: "pb-editor-block-category-testimonial",
        title: "Testimonial",
        description: "Display comments and user feedback.",
        icon: <TestimonialIcon />
    }
]: Array<CmsBlockCategoryPluginType>);
