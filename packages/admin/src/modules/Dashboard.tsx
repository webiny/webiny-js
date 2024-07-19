import React from "react";
import {
    CircleUser,
    Home,
    LineChart,
    Menu,
    Package,
    Package2,
    ShoppingCart,
    Users
} from "lucide-react";

import { Badge } from "~/ui/Badge";
import { Button } from "~/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "~/ui/Card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "~/ui/DropdownMenu";
import { Sheet, SheetContent, SheetTrigger } from "~/ui/Sheet";
import { ReactComponent as WebinyLogo } from "~/assets/logo.svg";
import { ReactComponent as CmsSketch } from "./Dashboard/cms-sketch.svg";
import { ReactComponent as FormsSketch } from "./Dashboard/forms-sketch.svg";
import fbSshot from "./Dashboard/fb-sshot.png";
import { TypographyH4, TypographyH5, TypographyH6 } from "~/ui/Typography";

export function Dashboard() {
    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <WebinyLogo className="sizes" />
                    </div>
                    <div className="flex-1">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                            <a
                                href="#"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <Home className="h-4 w-4" />
                                Audit Logs
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Forms
                                <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                    6
                                </Badge>
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
                            >
                                <Package className="h-4 w-4" />
                                CMS
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <Users className="h-4 w-4" />
                                Page Builder
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <LineChart className="h-4 w-4" />
                                Publishing Workflows
                            </a>{" "}
                            <a
                                href="#"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <LineChart className="h-4 w-4" />
                                Tenant Manager
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <LineChart className="h-4 w-4" />
                                Settings
                            </a>
                        </nav>
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <nav className="grid gap-2 text-lg font-medium">
                                <a
                                    href="#"
                                    className="flex items-center gap-2 text-lg font-semibold"
                                >
                                    <Package2 className="h-6 w-6" />
                                    <span className="sr-only">Acme Inc</span>
                                </a>
                                <a
                                    href="#"
                                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                >
                                    <Home className="h-5 w-5" />
                                    Dashboard
                                </a>
                                <a
                                    href="#"
                                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    Orders
                                    <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                        6
                                    </Badge>
                                </a>
                                <a
                                    href="#"
                                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                >
                                    <Package className="h-5 w-5" />
                                    Products
                                </a>
                                <a
                                    href="#"
                                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                >
                                    <Users className="h-5 w-5" />
                                    Customers
                                </a>
                                <a
                                    href="#"
                                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                >
                                    <LineChart className="h-5 w-5" />
                                    Analytics
                                </a>
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1"></div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <CircleUser className="h-5 w-5" />
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuItem>Support</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Logout</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main>
                    <div
                        className={"max-w-[1024px] mx-auto flex flex-1 flex-col gap-4 p-4 lg:gap-6"}
                    >
                        <div className="flex flex-col py-3">
                            <TypographyH4 text={"Hi Sven"} />
                            <p className="text-sm">
                                To get started - pick one of the actions below:
                            </p>
                        </div>

                        <div className="mx-auto flex gap-6">
                            <Card className="lg:max-w-md bg-muted/40" x-chunk="charts-01-chunk-0">
                                <CardHeader className={"pt-16 pb-8"}>
                                    <CmsSketch className="w-[113px] mx-auto" />
                                </CardHeader>
                                <CardContent>
                                    <TypographyH6 text={"Build a page"} className={"pb-1"}/>
                                    <p className="text-sm text-muted-foreground">
                                        Build stunning landing pages with an easy to use drag and
                                        drop editor.
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button size={"lg"} className={"w-full"}>
                                        Build a new page +
                                    </Button>
                                </CardFooter>
                            </Card>
                            <Card className="lg:max-w-md bg-muted/40" x-chunk="charts-01-chunk-0">
                                <CardHeader className={"pt-16 pb-8"}>
                                    <FormsSketch className="w-full w-[113px] mx-auto" />
                                </CardHeader>
                                <CardContent>
                                    <TypographyH6 text={"Create a form"} className={"pb-1"} />

                                    <p className="text-sm text-muted-foreground">
                                        Create forms using a drag and drop interface and track
                                        conversions.
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button size={"lg"} className={"w-full"}>
                                        Create a new form +
                                    </Button>
                                </CardFooter>
                            </Card>
                            <Card className="lg:max-w-md bg-muted/40" x-chunk="charts-01-chunk-0">
                                <CardHeader className={"pt-16 pb-8"}>
                                    <CmsSketch className="w-full w-[113px] mx-auto" />
                                </CardHeader>
                                <CardContent>
                                    <TypographyH6 text={"Create a content model"}  className={"pb-1"}/>
                                    <p className="text-sm text-muted-foreground">
                                        GraphQL based headless CMS with powerful content modeling
                                        features.
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button size={"lg"} className={"w-full"}>
                                        New content model +
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                        <div className="flex gap-6">
                            <Card className="bg-muted/40 p-5">
                                <CardContent>
                                    <TypographyH5
                                        text={"Learn more about Webiny:"}
                                        className={"pb-1.5"}
                                    />

                                    <p className="text-sm text-muted-foreground pb-5">
                                        Explore the Webiny documentation, learn about the
                                        architecture and check out code examples and guides:
                                    </p>

                                    <img src={fbSshot} />
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/40 p-5">
                                <CardContent>
                                    <TypographyH5
                                        text={"Learn more about Webiny:"}
                                        className={"pb-1.5"}
                                    />
                                    <p className="text-sm text-muted-foreground pb-5">
                                        Explore the Webiny documentation, learn about the
                                        architecture and check out code examples and guides:
                                    </p>
                                    <img src={fbSshot} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
