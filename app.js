const express = require('express')
const app = express()

const server = require('http').createServer(app)
const io = require('socket.io')(server)
const port = process.env.PORT || 8000
const allmsg = []
const clients = []

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
})

app.use(express.static(__dirname + "/public"))

// connection will call first
io.on('connection', (socket) => {

    socket.on('createOrJoin', (room) => {

        let numClients;
        let socketRoom = io.sockets.adapter.rooms[room]
        if(socketRoom!==undefined){
            numClients = socketRoom.length
        }else{
            numClients=0
        }
        
     
        if (numClients===0) {
            console.log("create", room)
            socket.join(room)
            socket.emit('create', room)
        } else {
            if (numClients < 5) {
                console.log(" join room",room)
                io.sockets.in(room).emit('join', room)
                socket.join(room)
                socket.emit('joined', room)
            } else {
                socket.emit('full', room)
            }
        }


    })

    socket.on("message", (message) => {
        log('S --> got message: ', message);
        console.log("channel",message.channel)
        socket.broadcast.to('room1').emit('message', message)
    })

    function log() {
        var array = [">>> "];
        for (var i = 0; i < arguments.length; i++) {
            array.push(arguments[i]);
        }
        socket.emit('log', array);
    }

})


server.listen(port, () => {
    console.log("listen in port:", port)
})

function storeAllMessage(msg) {
    allmsg.push(msg)
}


function storeClientInfo(clientInfo) {

    clients.push(clientInfo)
    // console.log('all client', clients)
}

function getSocketIDByName(name) {
    let index;
    for (let i = 0; i < clients.length; i++) {
        if (clients[i].name === name) {
            index = i
            break
        }
    }



    if (index > -1) {
        return clients[index].id
    }

}

function removeClientInfo(id) {

    let index;
    for (let i = 0; i < clients.length; i++) {
        if (clients[i].id === id) {
            index = i
            break
        }
    }


    if (index > -1) {
        return clients.splice(index, 1)
    }

}