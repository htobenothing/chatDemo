
navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
window.onbeforeunload = function (e) {
    hangup();
}

//  when this init success, will emit 'connection' to the server  
const socket = io()

const btnStart = document.getElementById('btnStart')
const btnCall = document.getElementById('btnCall')
const btnHungup = document.getElementById('btnHangup')
const btnSend = document.getElementById('btnSend')

const camLocal = document.getElementById('camLocal')
const camRemote = document.getElementById('camRemote')

const msgInput = document.getElementById('msgInput')
const msgList = document.getElementById('msglist')

let localStream, remoteStream
let sendChannel, recieveChannel

let isStart=false, isInitiator, isChannelReady;


let pc_config = { 'iceServers': [{ 'url': 'stun:23.21.150.121' }] } // IP address
// { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] };

let pc_constraints = {
    'optional': [
        { 'DtlsSrtpKeyAgreement': true }
    ]
};


let constraints = {
    video: {
        mandatory: {
            maxWidth: 320,
            maxHeight: 240
        }
    },
    audio: false
}
let sdpConstraints = {};



const channel = prompt("enter your channel")

socket.on('connect', () => {
    console.log("channel", channel)
    if (channel !== '') {
        socket.emit('createOrJoin', channel)
    }
})

socket.on('create', (room) => {
    console.log('create room:', room)
    isInitiator = true

    navigator.getUserMedia(constraints, handleUserMedia, handleUserMediaError)
    checkAndStart()
})

socket.on('join', (room) => {
    console.log('Another peer made a request to join room ' + room);
    console.log('This peer is the initiator of room ' + room + '!');
    isChannelReady = true;

})

socket.on('joined', function (room) {
    console.log('This peer has joined room ' + room);
    isChannelReady = true;

    // Call getUserMedia()
    navigator.getUserMedia(constraints, handleUserMedia, handleUserMediaError);
    console.log('Getting user media with constraints', constraints);
});


socket.on('log', function (array) {
    console.log.apply(console, array);
});


socket.on('message', function (message) {
    console.log('Received message:', message);
    if (message === 'getUserMedia') {
        checkAndStart();
    } else if (message.type === 'offer') {
        if (!isInitiator && !isStart) {
            checkAndStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
    } else if (message.type === 'answer' && isStart) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && isStart) {
        var candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
    } else if (message === 'bye' && isStart) {
        handleRemoteHangup();
    }
});




function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(pc_config, pc_constraints)
        pc.addStream(localStream);
        pc.onicecandidate = handleIceCandidate;
        console.log("create peer connection ")
    } catch (err) {
        console.log("failed create peer connection", "error:", err)
        return;
    }



    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;

    //  for text channel
    // if (isInitiator) {

    //     try {
    //         sendChannel = pc.createDataChannel("sendDataChannel", { reliable: true });
    //         trace('Created send data channel');
    //     } catch (error) {
    //         console.log('Failed to create data channel. ');
    //         trace('createDataChannel() failed with exception: ' + e.message);
    //     }
    //     sendChannel.onopen = handleSendChannelStateChange;
    //     sendChannel.onmessage = handleMessage;
    //     sendChannel.onclose = handleSendChannelStateChange;
    // } else {
    //     pc.ondatachannel = gotReceiveChannel;
    // }
}




function handleIceCandidate(event) {
    console.log('handleIceCandidate event: ', event);
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    } else {
        console.log('End of candidates.');
    }
}


function doCall() {
    console.log('Creating Offer...');
    pc.createOffer(setLocalAndSendMessage, onSignalingError, sdpConstraints);
}

function onSignalingError(error) {
    console.log('Failed to create signaling message : ' + error.name);
}

function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer(setLocalAndSendMessage, onSignalingError, sdpConstraints);
}

function setLocalAndSendMessage(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    sendMessage(sessionDescription);
}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    attachStream(camRemote, event.stream);
    console.log('Remote stream attached!!.');
    remoteStream = event.stream;
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}

function hangup() {
    console.log('Hanging up.');
    stop();
    sendMessage('bye');
}


function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
}


function stop() {
    isStart = false;
    if (sendChannel) sendChannel.close();
    if (receiveChannel) receiveChannel.close();
    if (pc) pc.close();
    pc = null;
    btnSend.disabled = true;
}


function checkAndStart() {
    console.log("create peer")
    console.log(isStart,localStream,isChannelReady)
    if (!isStart && typeof localStream !== 'undefined' && isChannelReady) {

        createPeerConnection();
        
        isStart = true;
        if (isInitiator) {
            console.log("do call")
            doCall();
        }
    }
}


const handleUserMedia = (stream) => {
    localStream = stream

    attachStream(camLocal, stream)
    console.log("adding local stream ")
    sendMessage('getUserMedia')
    // socket.emit('getUserMedia')
}

function handleUserMediaError(error) {
    console.log('navigator.getUserMedia error: ', error);
}


function attachStream(cam, stream) {
    if (window.URL) {
        cam.src = window.URL.createObjectURL(stream)
    } else {
        cam.src = stream
    }
}



function sendData() {
    var data = msgInput.value;
    if (isInitiator) {
        sendChannel.send(data);
    } else {
        receiveChannel.send(data);
    }
    trace('Sent data: ' + data);
}


function gotReceiveChannel(event) {
    trace('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.onmessage = handleMessage;
    receiveChannel.onopen = handleReceiveChannelStateChange;
    receiveChannel.onclose = handleReceiveChannelStateChange;
}

function handleMessage(event) {
    trace('Received message: ' + event.data);
    let li = document.createElement('li')
    li.appendChild(document.createTextNode(event.data))
    msgList.appendChild(li)
}


function handleSendChannelStateChange() {
    // only when the channel is ok , can send message
    let readyState = sendChannel.readyState
    trace('Send channel state is: ' + readyState);
    if (readyState === 'open') {
        msgInput.disable = false
        msgInput.focus()
        msgInput.placeholder = ""
        btnSend.disable = false
    } else {
        msgInput.disable = true
        btnSend.disable = true
    }
}

function handleReceiveChannelStateChange() {
    var readyState = receiveChannel.readyState;
    trace('Receive channel state is: ' + readyState);
    // If channel ready, enable user's input
    if (readyState == "open") {
        msgInput.disabled = false;
        msgInput.focus();
        msgInput.placeholder = "";
        btnSend.disabled = false;
    } else {
        msgInput.disabled = true;
        btnSend.disabled = true;
    }
}









function sendMessage(message) {
    console.log('Sending message: ', message);
    socket.emit('message', message);
}







btnSend.onclick = () => {
    let msg = msgInput.value
    showMessage(msg, true)

    let infos = msg.split("::")

    if (infos[1] !== undefined) {
        resp = {
            youName: person,
            tarName: infos[1],
            message: infos[0]
        }
        console.log("private message")
        socket.emit("pmsg", resp)
    } else {
        console.log("normal")
        socket.emit("message", person + ":" + msg)
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

function showMessage(msg, isSelf) {
    console.log("get message")
    let msgli = document.createElement('li')
    msgli.appendChild(document.createTextNode(msg))

    if (isSelf) {
        msgli.className = "self"
    } else {
        msgli.className = "other"
    }
    msgList.appendChild(msgli)
}

