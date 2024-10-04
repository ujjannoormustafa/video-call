const socket = io();
let localStream;
let remoteStream;
let peerConnection;
const roomInput = document.getElementById('room-input');
const joinButton = document.getElementById('join-btn');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');

joinButton.onclick = async () => {
    const room = roomInput.value;
    if (room) {
        socket.emit('join', room);
        await startVideo(room);
    } else {
        alert("Please enter a room name.");
    }
};

async function startVideo(room) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    peerConnection = new RTCPeerConnection();

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { candidate: event.candidate, room });
        }
    };

    peerConnection.ontrack = (event) => {
        remoteStream = new MediaStream();
        remoteStream.addTrack(event.track);
        remoteVideo.srcObject = remoteStream;
    };

    socket.on('user-connected', (userId) => {
        console.log(`User connected: ${userId}`);
        createOffer(room);
    });

    socket.on('offer', (data) => {
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        createAnswer(room);
    });

    socket.on('answer', (data) => {
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on('ice-candidate', (data) => {
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    });
}

async function createOffer(room) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { offer, room });
}

async function createAnswer(room) {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { answer, room });
}
