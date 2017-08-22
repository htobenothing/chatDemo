//  when this init success, will emit 'connection' to the server  
const socket = io()

const btnSend = document.getElementById("send")
const msgInput = document.getElementById('m')
const msgList = document.getElementById('messages')

const person = prompt("enter your name")
let clientInfo;

socket.on('connect', () => {
    socket.emit('newUser', person)

})

btnSend.onclick = () => {
    let msg = msgInput.value
    showMessage(msg,true)
    
    let infos = msg.split("::")
  
    if (infos[1] !== undefined) {
        resp = {
            youName:person,
            tarName: infos[1],
            message: infos[0]
        }
        console.log("private message")
        socket.emit("pmsg", resp)
    }else{
        console.log("normal")
        socket.emit("message", person+":" + msg)
    }
    
    msgInput.value = ""
}

socket.on('message', (msg) => {
    showMessage(msg)
})



socket.on('welcome', (msg) => {
    showMessage(msg)
})

socket.on('bye', (msg) => {
    showMessage(msg)
})

function showMessage(msg,isSelf) {
    console.log("get message")
    let msgli = document.createElement('li')
    msgli.appendChild(document.createTextNode(msg))
    
    if (isSelf){
        msgli.className= "self"
    }else{
        msgli.className ="other"
    }
    msgList.appendChild(msgli)
}

