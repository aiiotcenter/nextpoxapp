import Link from "next/link";
import React from "react";
import Image from "next/image";

function Menu() {
    return (
        <div className="menu">
            <div className="neu-logo">
                <Image
                    src="/assets/logos/neu-logo.png"
                    alt=""
                    width={50}
                    height={40}
                />
            </div>

            <Link href="/dashboard">
                <div className="navigation-item">
                    <div className="image">
                        <Image
                            src="/assets/icons/grid.svg"
                            alt=""
                            width={40}
                            height={40}
                        />
                    </div>
                    <div className="text">Dashboard</div>
                </div>
            </Link>

            <Link href="/predict">
                <div className="navigation-item">
                    <div className="image">
                        <Image
                            src="/assets/icons/aperture.svg"
                            alt=""
                            width={40}
                            height={40}
                        />
                    </div>
                    <div className="text">Predict</div>
                </div>
            </Link>

            {/* <Link href="/pastpredictions">
                <div className="navigation-item">
                    <div className="image">
                        <Image src="assets/icons/layers.svg" alt="" />
                    </div>
                    <div className="text">Past Predictions</div>
                </div>
            </Link> */}

            {/* <Link href="/models">
                <div className="navigation-item">
                    <div className="image">
                        <Image src="assets/icons/codesandbox.svg" alt="" />
                    </div>
                    <div className="text">Models</div>
                </div>
            </Link> */}

            {/* <Link href="/knowledgebase">
                <div className="navigation-item">
                    <div className="image">
                        <Image src="assets/icons/book-open.svg" alt="" />
                    </div>
                    <div className="text">Knowledgebase</div>
                </div>
            </Link> */}

            <Link href="/collaborators">
                <div className="navigation-item">
                    <div className="image">
                        <Image
                            src="/assets/icons/users.svg"
                            alt=""
                            width={40}
                            height={40}
                        />
                    </div>
                    <div className="text">Collaborators</div>
                </div>
            </Link>

            <Link href="/logout">
                <div className="navigation-item">
                    <div className="image">
                        <Image
                            src="/assets/icons/log-out.svg"
                            alt=""
                            width={40}
                            height={40}
                        />
                    </div>
                    <div className="text">Logout</div>
                </div>
            </Link>
        </div>
    );
}

export default Menu;
