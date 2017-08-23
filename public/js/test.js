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

