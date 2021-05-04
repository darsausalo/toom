import io from "socket.io-client";

const socket = io.connect(process.env.REACT_APP_SERVER_BASE_URL, {
    rejectUnauthorized: false
});

socket.on("connect_error", (err) => {
    console.error(`connect_error due to ${err.message}`);
});

export default socket;
