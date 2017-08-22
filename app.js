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


    socket.on('newUser', (name) => {
        clientInfo = {
            name: name,
            id: socket.id,
            createDate: new Date(),
        }

        storeClientInfo(clientInfo)
        socket.broadcast.emit('welcome',name + " is join the room ,let's welcome ")
        let welcome = 'Hello ' + name + '! Welcome to join the chat room, there is ' + clients.length + " Clients in the room"
        socket.emit('welcome', welcome)
    })


    socket.on('disconnect', () => {

        let client = removeClientInfo(socket.id)
        let message = client[0].name + " left the room"
        socket.broadcast.emit('bye', message)
    })

    socket.on('message', (msg) => {
        console.log("get message from client:", msg)
        socket.broadcast.emit("message", msg)
    })

    socket.on('pmsg', (resp) => {
        let youName = resp.youName
        let tarName = resp.tarName
        let msg = resp.message
    
        let id =  getSocketIDByName(tarName)
        if(id !==undefined){
            socket.broadcast.to(id).emit('message',youName+":"+msg)
        }
        
    })



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



    if(index > -1){
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