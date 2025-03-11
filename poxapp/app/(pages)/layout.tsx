import React from "react";
import Header from "./header";
import Menu from "./Menu";

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Header />
            <Menu />
            <div className="main-container">{children}</div>
        </>
    );
}
