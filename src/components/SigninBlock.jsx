import React, {useState} from 'react';
import axios from 'axios';
import "./SigninBlock.css";

import {Tabs, Tab, Alert, Form, Button, Jumbotron} from "react-bootstrap";

function SigninBlock({onLogin, setAlertMessage}) {
    const [validated, setValidated] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setLoading] = useState(false);

    const onEnter = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const form = e.currentTarget;
        const valid = form.checkValidity();
        setValidated(true);

        if (valid) {
            setLoading(true);

            try {
                const res = await axios.post("/user/signin", {email, password});
                setLoading(false);
                onLogin(res.data);
            } catch (error) {
                setLoading(false);
                if (error.response.status === 404 || error.response.status === 403) {
                    setAlertMessage("Неверный email или пароль.");
                    return;
                }
                setAlertMessage("Произошла непредвиденная ошибка - повторите попытку позже или обратитесь к администратору");
            }
        }
    };

    return (
        <div>
            <Form noValidate validated={validated} onSubmit={onEnter}>
                <Form.Group controlId="userEmail">
                    <Form.Control
                        autoFocus
                        required
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Form.Group>
                <Form.Group controlId="password">
                    <Form.Control
                        required
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </Form.Group>
                <Button
                    type="submit"
                    disabled={isLoading}
                    variant="primary">
                    {isLoading ? "Вход..." : "Войти"}
                </Button>
            </Form>
        </div>
    );
}

function SignupBlock({setAlertMessage}) {
    const [validated, setValidated] = useState(false);
    const [email, setEmail] = useState("");
    const [fullname, setFullname] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setLoading] = useState(false);

    const onEnter = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const form = e.currentTarget;
        const valid = form.checkValidity();
        setValidated(true);

        if (valid) {
            setLoading(true);

            try {
                await axios.post("/user/signup", {email, fullname, password});
                setAlertMessage("Вам отправлено письмо для подтверждения email. Пройдите по ссылке в письме, чтобы завершить регистрацию.", true);
                setLoading(false);
            } catch (error) {
                setLoading(false);
                if (error.response.status === 422) {
                    setAlertMessage(error.response.data.errors.join());
                    return;
                }
                setAlertMessage("Произошла непредвиденная ошибка - повторите попытку позже или обратитесь к администратору");
            }
        }
    };

    return (
        <div>
            <Form noValidate validated={validated} onSubmit={onEnter}>
                <Form.Group controlId="userName">
                    <Form.Control
                        required
                        type="text"
                        value={fullname}
                        placeholder="Имя"
                        onChange={(e) =>setFullname(e.target.value)}
                    />
                </Form.Group>
                <Form.Group controlId="userEmail">
                    <Form.Control
                        autoFocus
                        required
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Form.Group>
                <Form.Group controlId="userPassword">
                    <Form.Control
                        required
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                        title="Пароль должен сожержать как минимум одну цифру и букву в верхнем и нижнем регистре и быть не меньше 8 символов."
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </Form.Group>
                <Button
                    type="submit"
                    disabled={isLoading}
                    variant="primary">
                    {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
            </Form>
        </div>
    );
}

function JoinBlock({onLogin}) {
    const [alertMessage, setAlertMessage] = useState("");
    const [alertVariant, setAlertVariant] = useState("danger");
    const setAlert = (message, success = false) => {
        setAlertVariant(success ? "success": "danger");
        setAlertMessage(message);
    };

    return (
        <div className="Login">
            <Jumbotron>
                <h1>TOOM meetings</h1>
            </Jumbotron>
            <Alert show={alertMessage.length > 0} onClose={() => setAlertMessage("")} variant={alertVariant} dismissible>
                <p>{alertMessage}</p>
            </Alert>
            <Tabs defaultActiveKey="signin" id="login-tabs" variant="pills" className="justify-content-center">
                <Tab eventKey="signin" title="Вход">
                    <SigninBlock onLogin={onLogin} setAlertMessage={setAlert}/>
                </Tab>
                <Tab eventKey="signup" title="Регистрация">
                    <SignupBlock setAlertMessage={setAlert}/>
                </Tab>
            </Tabs>
        </div>
    );
}

export default JoinBlock;
