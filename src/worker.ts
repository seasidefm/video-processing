import zmq  from "zeromq"

const sock = zmq.socket("sub");

sock.connect(`tcp://${process.env.PUB_HOST}:${process.env.PUB_PORT}`);
console.log("Connected to publisher!");

sock.subscribe("mkv-to-mp4");
sock.on("message", function(topic: Buffer, message: Buffer) {
    console.log(`Starting transcoding job for ${message.toString("utf-8")}`)
});