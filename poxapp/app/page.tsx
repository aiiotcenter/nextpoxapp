"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./styles/index.css";

export default function Home() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const router = useRouter();

    function login() {
        if (username == "profdux" && password == "dux123") {
            router.push("/dashboard");
        }
    }

    return (
        <>
            <div className="split-view-container">
                <div className="background-view">
                    <img src="/assets/background.png" alt="" />
                </div>

                <div className="login-container">
                    <div className="logo-container">
                        <img src="/assets/logos/air-logo.png" alt="" />
                        <img src="/assets/logos/rcaiot-logo.png" alt="" />
                    </div>

                    <div className="login-form">
                        <h1 className="login-heading">Skin Conditions App</h1>
                        <div className="input-element">
                            <input
                                type="text"
                                className="username"
                                placeholder="username"
                                required
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="input-element">
                            <input
                                type="password"
                                className="password"
                                placeholder="password"
                                required
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button onClick={login}>Login</button>
                        <div className="bubble-message-container">Error</div>
                    </div>
                </div>
            </div>
        </>
    );
}
