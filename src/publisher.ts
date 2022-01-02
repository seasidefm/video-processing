import express from 'express'
import zmq from 'zeromq'

const app = express()

console.log('📼 Starting SeasideFM job broker...')

console.log('Setting up ZMQ...')
const sock = zmq.socket('pub')
sock.bindSync(`tcp://0.0.0.0:${process.env.PUB_PORT || 3000}`)

app.get('/', (req, res) => {
    sock.send(["mkv-to-mp4", "2022-01-01_13-46-15.mkv "])
    res.send('Job created!')
})

app.listen(Number(process.env.WEB_PORT || 5000), '0.0.0.0', () => {
    console.log('Express server is running!')
})