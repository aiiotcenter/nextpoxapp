import React from "react";
import "./loader.css";
import "@/app/styles/spinkit.css";

export default function Loader() {
    return (
        <div className="loader-view">
            <div>
                <div className="sk-grid">
                    <div className="sk-grid-cube"></div>
                    <div className="sk-grid-cube"></div>
                    <div className="sk-grid-cube"></div>
                    <div className="sk-grid-cube"></div>
                    <div className="sk-grid-cube"></div>
                    <div className="sk-grid-cube"></div>
                    <div className="sk-grid-cube"></div>
                    <div className="sk-grid-cube"></div>
                    <div className="sk-grid-cube"></div>
                </div>
            </div>
        </div>
    );
}
