import React from "react";
import socket from "../socket";
import Peer from "simple-peer";

import "./UserBlock.css";

import {Alert, Navbar, Card, CardDeck, Row, Col, Button, Form, ListGroup, Badge} from "react-bootstrap";
import {CameraVideo, CameraVideoOff, Mic, MicMute} from "react-bootstrap-icons";
import axios from "axios";

const videoConstraints = {
    height: 240,
    width: 320
};

const Video = (props) => {
    const ref = React.useRef();

    React.useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        });
        props.peer.on("track", (track, stream) => {
            console.log("on track:", track);
        });
    }, []);

    return (
        <video playsInline autoPlay ref={ref}/>
    );
};

function VideoBlock({state}) {
    const [peers, setPeers] = React.useState([]);
    const socketRef = React.useRef(null);
    const userVideo = React.useRef();
    const peersRef = React.useRef([]);
    const streamRef = React.useRef(null);
    const [isVideoOn, setIsVideoOn] = React.useState(true);
    const [isAudioOn, setIsAudioOn] = React.useState(true);

    React.useEffect(() => {
        socketRef.current = socket;
        navigator.mediaDevices.getUserMedia({video: videoConstraints, audio: true}).then(stream => {
            userVideo.current.srcObject = stream;
            streamRef.current = stream;
            console.log("stream:", stream);
            socket.emit("VIDEO:JOIN", {meetingId: state.meeting._id, userId: state.user._id});
            socketRef.current.on("VIDEO:SET_PEERS", participants => {
                console.log("VIDEO:SET_PEERS", participants);
                const peers = [];
                participants.forEach(participant => {
                    const peer = createPeer(participant.socketId, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: participant.socketId,
                        peer,
                    })
                    peers.push(peer);
                })
                setPeers(peers);
            })

            socketRef.current.on("VIDEO:STARTED", payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                })

                setPeers(peers => [...peers, peer]);
            });

            socketRef.current.on("VIDEO:RECEIVING_RETURNED_SIGNAL", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
                console.log("VIDEO:RECEIVING_RETURNED_SIGNAL");
                streamRef.current.getTracks().forEach(track => {
                    console.log("track:", track);
                });
            });

            socketRef.current.on("MEETING:REMOVE_PARTICIPANT", participant => {
                const item = peersRef.current.find(p => p.peerID === participant.socketId);
                if (item) {
                    item.peer.destroy();
                    const id = peersRef.current.indexOf(item);
                    peersRef.current.splice(id, 1);
                    const newPeers = peers.filter(p => p.peerID !== item.peerID);
                    setPeers(newPeers);
                }
            });

        });

        return function cleanup() {
            peers.forEach(peer => peer.destroy());
            setPeers([]);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    track.stop();
                });
            }
        }
    }, []);

    const createPeer = (userToSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("VIDEO:SENDING_SIGNAL", {userToSignal, callerID, signal});
        })

        return peer;
    }

    const addPeer = (incomingSignal, callerID, stream) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            socketRef.current.emit("VIDEO:RETURNING_SIGNAL", {signal, callerID});
        })

        peer.signal(incomingSignal);

        return peer;
    }

    const onToggleVideo = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                if (track.kind === "video") {
                    track.enabled = !track.enabled;
                    setIsVideoOn(track.enabled);
                }
            });
        }
    };
    const onToggleAudio = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                if (track.kind === "audio") {
                    track.enabled = !track.enabled;
                    setIsAudioOn(track.enabled);
                }
            });
        }
    };

    return (
        <Col sm={8}>
            <CardDeck>
                <Card>
                    <Card.Body>
                        <video muted ref={userVideo} autoPlay playsInline/>
                        <br/>
                        {isVideoOn && <CameraVideo size={24} onClick={onToggleVideo} cursor="pointer"/>}
                        {!isVideoOn && <CameraVideoOff size={24} onClick={onToggleVideo} cursor="pointer"/>}
                        {isAudioOn && <Mic size={24} onClick={onToggleAudio} cursor="pointer"/>}
                        {!isAudioOn && <MicMute size={24} onClick={onToggleAudio} cursor="pointer"/>}
                    </Card.Body>
                </Card>
                {peers.map((peer, index) => (
                        <Card key={index}>
                            <Card.Body>
                                <Video peer={peer}/>
                            </Card.Body>
                        </Card>
                    )
                )}
            </CardDeck>
        </Col>
    );
}

function MeetingBlock({state, dispatch}) {
    const [messageValue, setMessageValue] = React.useState('');
    const messagesRef = React.useRef(null);

    const onSendMessage = () => {
        if (messageValue.length > 0) {
            socket.emit("MEETING:NEW_MESSAGE", {
                meetingId: state.meeting._id,
                userId: state.user._id,
                text: messageValue,
            });
            setMessageValue("");
        }
    };

    React.useEffect(() => {
        messagesRef.current.scrollTo(0, 99999);
    }, [state.messages]);

    const onExit = (e) => {
        e.preventDefault();
        console.log("Exit!");
        dispatch({
            type: "MEETING:EXIT",
        });
        socket.emit("MEETING:EXIT");
    };

    const chatCol = state.meeting.useVideo ? 4 : 12;

    return (
        <div>
            <Navbar bg="light" variant="light">
                <Navbar.Brand>{state.meeting.subject} ({state.meeting._id})</Navbar.Brand>
                <Navbar.Collapse className="justify-content-end">
                    <Navbar.Text>{state.user.fullname} <a href="#" onClick={onExit}>[Выйти]</a></Navbar.Text>
                </Navbar.Collapse>
            </Navbar>
            <br/>
            <Row>
                {state.meeting.useVideo && <VideoBlock state={state}/>}
                <Col sm={chatCol} className="justify-content-around">
                    <h5>Участники</h5>
                    <ListGroup>
                        {state.participants.map((participant, index) => (
                            <ListGroup.Item key={index}
                                            variant={participant.user._id === state.user.id ? "info" : "light"}>
                                {participant.user.fullname}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                    <br/>
                    <h5>Чат</h5>
                    <div className="chat-messages">
                        <div ref={messagesRef} className="messages">
                            {state.messages.map((message, index) => (
                                <div className="message" key={index}>
                                    <p className={message.user._id === state.user._id ? "my" : ""}>{message.text}</p>
                                    <div>
                                        <span>{new Date(message.createdAt).toLocaleTimeString()}: </span>
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
    const [useVideo, setUseVideo] = React.useState(false);
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
                console.log("useVideo:", useVideo);
                const res = await axios.create({headers: {token: state.token}}).post("/meeting", {subject, useVideo});
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
                            <Form.Group>
                                <Form.Check
                                    type="checkbox"
                                    label="Использовать видео"
                                    checked={useVideo}
                                    onChange={(e) => setUseVideo(e.target.checked)}
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
                    <Card.Header as="h5">Мои встречи</Card.Header>
                    <Card.Body>
                        <Card.Text>
                            Здесь вы можете прсмотреть встречи, которые вы создали
                        </Card.Text>
                        {state.meetings.map((meeting, index) => (
                            <Card.Text className="text-left" key={index}>
                                {meeting.subject}{meeting.useVideo && (
                                <Badge variant="success">Видео</Badge>)}: {meeting._id}
                                <br/>
                                <Button onClick={() => onJoinMeeting(meeting._id)}>Присоединится</Button>
                            </Card.Text>
                        ))}
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
