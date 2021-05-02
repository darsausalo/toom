import React from "react";

import reducer from "./reducer";
import SigninBlock from "./components/SigninBlock";
import UserBlock from "./components/UserBlock";

import {Jumbotron, Container, Row, Col} from "react-bootstrap";

function App() {
    const [state, dispatch] = React.useReducer(reducer, {
        token: null,
    });

    const onLogin = async (payload) => {
        console.log("we join: " + payload.roomId);
    };

    return (
        <Container>
            {!state.loggedIn ? (
                <SigninBlock onLogin={onLogin}/>
            ) : (
                <UserBlock/>
            )}
        </Container>
    );
}

export default App;
