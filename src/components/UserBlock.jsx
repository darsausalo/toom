import React from "react";
import socket from "../socket";

import "./UserBlock.css";

import {Alert, Navbar, Card, CardDeck, Row, Col, Button, Form, ListGroup} from "react-bootstrap";
import axios from "axios";

function MeetingBlock({state}) {
    const [messageValue, setMessageValue] = React.useState('');
    const messagesRef = React.useRef(null);

    const onSendMessage = () => {
        socket.emit("MEETING:NEW_MESSAGE", {
           meetingId: state.meeting._id,
           userId: state.user._id,
           text: messageValue,
        });
        setMessageValue("");
    };

    React.useEffect(() => {
        messagesRef.current.scrollTo(0, 99999);
    }, [state.messages]);

    return (
        <div>
            <Navbar bg="light" variant="light">
                <Navbar.Brand>{state.meeting.subject} ({state.meeting._id})</Navbar.Brand>
                <Navbar.Collapse className="justify-content-end">
                    <Navbar.Text>{state.user.fullname}</Navbar.Text>
                </Navbar.Collapse>
            </Navbar>
            <br/>
            <Row>
                <Col sm={8}>
                    TODO: video
                </Col>
                <Col sm={4} className="justify-content-around">
                    <h5>Участники</h5>
                    <ListGroup>
                        {state.participants.map((participant) => (
                            <ListGroup.Item key={participant.user._id} variant={participant.user._id === state.user.id ? "info" : "light"}>{participant.user.fullname}</ListGroup.Item>
                        ))}
                    </ListGroup>
                    <br/>
                    <h5>Чат</h5>
                    <div className="chat-messages">
                        <div ref={messagesRef} className="messages">
                            {state.messages.map((message) => (
                                <div className="message" key={message._id}>
                                    <p>{message.text}</p>
                                    <div>
                                        <span>{message.user.fullname}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <br/>
                        <form>
                            <label>Сообщение:</label>
                            <textarea
                                value={messageValue}
                                onChange={(e) => setMessageValue(e.target.value)}
                                className="form-control"
                                rows="3"/>
                            <br/>
                            <button onClick={onSendMessage} type="button" className="btn btn-primary">
                                Отправить
                            </button>
                        </form>
                    </div>
                </Col>
            </Row>
        </div>
    );
}

function JoinBlock({state, dispatch}) {
    const [subject, setSubject] = React.useState("");
    const [meetingId, setMeetingId] = React.useState("");
    const [alertMessage, setAlertMessage] = React.useState("");
    const [alertVariant, setAlertVariant] = React.useState("success");
    const [isLoading, setLoading] = React.useState(false);
    const [createValidated, setCreateValidated] = React.useState(false);
    const [joinValidated, setJoinValidated] = React.useState(false);

    const setAlert = (message, success = true) => {
        setAlertVariant(success ? "success" : "danger");
        setAlertMessage(message);
    }

    const onCreate = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const form = e.currentTarget;
        const valid = form.checkValidity();
        setCreateValidated(true);

        if (valid) {
            setLoading(true);
            try {
                const res = await axios.create({headers: {token: state.token}}).post("/meeting", {subject});
                setMeetingId(res.data._id);
                setSubject("");
                setAlert("Встреча успешно создана!");
                console.log(res.data);
                dispatch({
                    action: "MEETING:CREATE",
                    payload: {
                        meeting: res.data,
                    }
                })
                setLoading(false);
                await onJoinMeeting(res.data._id);
            } catch (e) {
                setLoading(false);
                if (e.response.status === 422) {
                    setAlert("Встреча с такой темой уже существует", false);
                } else {
                    setAlert("Произошла непредвиденная ошибка", false);
                    console.error(e);
                }
            }
        }
    };

    const onJoinMeeting = async (id) => {
        console.log("join meeting: ", id);
        const res = await axios.create({headers: {token: state.token}}).get("/meeting/join/" + id);
        console.log("joined participants:", res.data);

        dispatch({
            type: "MEETING:JOIN",
            payload: {
                meeting: res.data.meeting,
                participants: res.data.participants,
            },
        });

        const payload = {meetingId: id, userId: state.user._id};
        socket.emit("MEETING:JOIN", payload);
    }

    const onJoin = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const form = e.currentTarget;
        const valid = form.checkValidity();
        setJoinValidated(true);

        if (valid) {
            await onJoinMeeting(meetingId);
        }
    };

    return (
        <div>
            <Navbar bg="light" variant="light">
                <Navbar.Brand>Toom</Navbar.Brand>
                <Navbar.Collapse className="justify-content-end">
                    <Navbar.Text>{state.user.fullname}</Navbar.Text>
                </Navbar.Collapse>
            </Navbar>
            <br/>
            <Alert show={alertMessage.length > 0} onClose={() => setAlertMessage("")} variant={alertVariant}
                   dismissible>
                <p>{alertMessage}</p>
            </Alert>
            <CardDeck>
                <Card className="text-center">
                    <Card.Header as="h5">Создать</Card.Header>
                    <Card.Body>
                        <Card.Text>
                            Вы можете создать новую встречу. После её создания вы получите код встречи,
                            который можете разослать участникам.
                        </Card.Text>
                        <Form noValidate validated={createValidated} onSubmit={onCreate}>
                            <Form.Group controlId="subject">
                                <Form.Control
                                    type="text"
                                    required
                                    autoFocus
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Тема встречи"
                                />
                            </Form.Group>
                            <Button disabled={isLoading} variant="primary" type="submit">Создать</Button>
                        </Form>
                    </Card.Body>
                </Card>
                <br/>
                <Card className="text-center">
                    <Card.Header as="h5">Присоединится</Card.Header>
                    <Card.Body>
                        <Card.Text>
                            Вы можете присоединится к уже созданной встрече.
                        </Card.Text>
                        <Form noValidate validated={joinValidated} onSubmit={onJoin}>
                            <Form.Group controlId="meetingCode">
                                <Form.Control
                                    type="text"
                                    required
                                    value={meetingId}
                                    onChange={(e) => setMeetingId(e.target.value)}
                                    placeholder="ID встречи"
                                />
                            </Form.Group>
                            <Button disabled={isLoading} variant="primary" type="submit">Присоединиться</Button>
                        </Form>
                    </Card.Body>
                </Card>
                <Card className="text-center">
                    <Card.Header as="h5">Мои втречи</Card.Header>
                    <Card.Body>
                        <Card.Text>
                            Здесь вы можете прсмотреть встречи, которые вы создали
                        </Card.Text>
                        {state.meetings.map((meeting) => (
                            <Card.Text className="text-left" key={meeting._id}>
                                {meeting.subject}: {meeting._id}
                                <Button onClick={() => onJoinMeeting(meeting._id)}>Присоединится</Button>
                            </Card.Text>
                        ))};
                    </Card.Body>
                </Card>
            </CardDeck>
        </div>
    );
}

function UserBlock({state, dispatch}) {
    return (
        <div>
            {state.meeting ? (
                <MeetingBlock state={state} dispatch={dispatch}/>
            ) : (
                <JoinBlock state={state} dispatch={dispatch}/>
            )}
        </div>
    );
}

export default UserBlock;
