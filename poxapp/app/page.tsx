"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./styles/index.css";

export default function Home() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const router = useRouter();

    function login() {
        if (!username || !password) {
            setError("Please enter both username and password");
            setTimeout(() => setError(""), 3000);
            return;
        }

        if (username === "profdux" && password === "dux123") {
            router.push("/dashboard");
        } else {
            setError("Invalid credentials");
            setTimeout(() => setError(""), 3000);
        }
    }

    function handleKeyPress(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            login();
        }
    }

    return (
        <div className="split-view-container">
            <div className="background-view">
                <img src="/assets/vectorBG.png" alt="background-img" />
            </div>

            <div className="login-container">

                <div className="login-form">
                    <h1 className="login-heading">FESAT</h1>
                    <p className="login-subheading">Vector Classification System</p>
                    
                    <div className="input-element">
                        <input
                            type="text"
                            className="username"
                            placeholder="Username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </div>
                    
                    <div className="input-element">
                        <input
                            type="password"
                            className="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </div>
                    
                    <button onClick={login}>Login</button>
                    
                    {error && (
                        <div className="bubble-message-container visible">
                            {error}
                        </div>
                    )}
                </div>

                <div className="logo-container flex">
                    <img src="/assets/logos/rcaiot-logo.png" alt="RCAIOT Logo" />
                    <img src="/assets/logos/air-logo.png" alt="AIR Logo" />
                </div>
            </div>
        </div>
    );
}