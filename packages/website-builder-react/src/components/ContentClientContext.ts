"use client";
import React from "react";
import type { ContentClient } from "@webiny/website-builder-sdk";

export const ContentClientContext = React.createContext<ContentClient | undefined>(undefined);
