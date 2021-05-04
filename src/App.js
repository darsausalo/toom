import React from "react";

import reducer from "./reducer";
import SigninBlock from "./components/SigninBlock";
import UserBlock from "./components/UserBlock";

import socket from "./socket";

import {Container} from "react-bootstrap";
import axios from "axios";

function App() {
    const [state, dispatch] = React.useReducer(reducer, {
        token: null,
        user: null,
        meeting: null,
        meetings: [],
        participants: [],
        messages: [],
    });

    const onLogin = async (payload) => {
        const token = payload.token;
        const res = await axios.create({headers:{token}}).get("/user/me");

        dispatch({
            type: "JOINED",
            payload: {
                token,
                user: res.data.user,
                meetings: res.data.meetings,
            }
        });
    };

    const setParticipants = (participants) => {
        console.log("MEETING:SET_PARTICIPANTS:", participants);
        dispatch({
            type: "SET_PARTICIPANTS",
            payload: {participants},
        });
    };

    const addParticipant = (participant) => {
        console.log("MEETING:ADD_PARTICIPANT", participant);
        dispatch({
            type: "ADD_PARTICIPANT",
            payload: {participant},
        });
    }

    const removeParticipant = (participant) => {
        console.log("MEETING:REMOVE_PARTICIPANT", participant);
        dispatch({
            type: "REMOVE_PARTICIPANT",
            payload: {participantId: participant._id},
        });
    }

    const setMessages = (messages) => {
        dispatch({
            type: "SET_MESSAGES",
            payload: {messages},
        })
    }

    const addMessage = (message) => {
        console.log("MEETING:ADD_MESSAGE:", message);
        dispatch({
            type: "NEW_MESSAGE",
            payload: message
        })
    };

    React.useEffect(() => {
        socket.on("MEETING:SET_PARTICIPANTS", setParticipants);
        socket.on("MEETING:ADD_PARTICIPANT", addParticipant);
        socket.on("MEETING:REMOVE_PARTICIPANT", removeParticipant);
        socket.on("MEETING:SET_MESSAGES", setMessages);
        socket.on("MEETING:ADD_MESSAGE", addMessage);
    }, []);

    window.socket = socket;

    return (
        <Container>
            {!state.token ? (
                <SigninBlock onLogin={onLogin}/>
            ) : (
                <UserBlock state={state} dispatch={dispatch}/>
            )}
        </Container>
    );
}

export default App;
