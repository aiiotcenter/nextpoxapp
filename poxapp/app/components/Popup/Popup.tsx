"use client";

import { ReactNode } from "react";
import "./Popup.css";
import Image from "next/image";

interface PopupProps extends React.HTMLAttributes<HTMLFormElement> {
    title: string;
    children?: ReactNode;
    onClose: () => void;
    closable?: boolean;
    className?: string;
    type?: "manual" | "maximum";
}

export function Popup({
    title = "Untitled Popup",
    children,
    onClose,
    onSubmit,
    closable = true,
    type = "manual",
    className = "",
}: PopupProps) {
    return (
        <div className="overlay">
            <form className={`popup ${className} ${type}`} onSubmit={onSubmit}>
                <div className="popupHeader">
                    <h1 className="popupTitle">{title}</h1>
                    {closable && (
                        <div className="closeButton" onClick={onClose}>
                            <Image
                                src="/assets/icons/close.png"
                                alt={""}
                                height={10}
                                width={10}
                            />
                        </div>
                    )}
                </div>

                <>{children ?? <></>}</>
            </form>
        </div>
    );
}

interface PopupBodyProps {
    children?: ReactNode;
    className?: string;
    size?: {
        height: string;
        width: string;
    };
    onCopy?: () => void;
}

interface PopupFooterProps {
    children?: ReactNode;
    className?: string;
}

export function PopupBody({
    children,
    className = "",
    size = { width: "unset", height: "unset" },
    onCopy,
}: PopupBodyProps) {
    return (
        <div
            onCopy={onCopy}
            className={`popupBody ${className}`}
            style={{
                width: size.width,
                height: size.height,
            }}
        >
            <>{children}</>
        </div>
    );
}

export function PopupFooter({ children, className = "" }: PopupFooterProps) {
    return <div className={`popupFooter ${className}`}>{children}</div>;
}
