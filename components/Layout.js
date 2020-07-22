import React from "react";
import Head from "../components/head";
import Logo from "../static/Logo.svg";
import {Container} from "react-bootstrap";

function Layout(props) {
    return <div>
        <Head />
        <header className="header">
            <Container>
                <div className="logo">
                    <Logo />
                    Dokumendi<span>Baas</span>
                </div>


            </Container>
        </header>
        <main>
            <Container>
                {props.children}
            </Container>
        </main>
        <footer>

        </footer>
    </div>
}

export default Layout;