import io from "socket.io-client";

const socket = io("http://localhost:3001", {
    rejectUnauthorized: false
});

socket.on("connect_error", (err) => {
    console.error(`connect_error due to ${err.message}`);
});

export default socket;
