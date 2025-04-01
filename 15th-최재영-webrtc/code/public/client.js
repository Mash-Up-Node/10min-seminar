// WebSocket 연결
const socket = io()

// 요소 참조
const publishButton = document.getElementById('publishButton')
const pubVideo = document.getElementById('pubVideo')
const mediaTypeSelect = document.getElementById('mediaTypeSelect')
const pubIdDisplay = document.getElementById('pubIdDisplay')
const connectButton = document.getElementById('connectButton')
const pubIdInput = document.getElementById('pubIdInput')
const subVideo = document.getElementById('subVideo')
const connectionStatus = document.getElementById('connectionStatus')

// 상태 관리
let localStream
let peerConnections = {} // pub: subscriberId → RTCPeerConnection
let peerConnection       // sub: 단일 퍼블리셔용

// ========== [Publisher Flow] ==========

// [Pub-1] 퍼블리셔가 "송출" 버튼 클릭 시
publishButton.onclick = async () => {
  const selectedMediaType = mediaTypeSelect.value
  
  if (!localStream) {
    try {
      if (selectedMediaType === 'camera') {
        // 카메라 사용
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      } else if (selectedMediaType === 'screen') {
        // 화면 공유 사용
        localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      }

      pubVideo.srcObject = localStream
    } catch (error) {
      console.error('미디어 접근 실패:', error)
      return
    }
  }

  // [Pub-2] 퍼블리셔 등록 요청
  socket.emit('publisher-register')
}

// [Pub-3] 서버로부터 퍼블리셔 ID 수신
socket.on('publisher-id-assigned', (pubId) => {
  pubIdDisplay.textContent = `Publisher ID: ${pubId}`
})

// [Pub-4] 서버로부터 특정 구독자의 offer 요청
socket.on('subscriber-offer-request', async (subscriberId) => {
  const pc = new RTCPeerConnection()
  peerConnections[subscriberId] = pc

  // 트랙 추가
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))

  // offer 생성 및 전송
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  socket.emit('publisher-send-offer', { subscriberId, offer })

  // ICE 후보 전송
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { targetId: subscriberId, candidate: event.candidate })
    }
  }
})

// [Pub-5] 구독자의 answer 수신
socket.on('subscriber-answer', async ({ senderId, answer }) => {
  const pc = peerConnections[senderId]
  if (pc) {
    await pc.setRemoteDescription(new RTCSessionDescription(answer))
  }
})

// ========== [Subscriber Flow] ==========

// [Sub-1] 구독자가 "연결" 버튼 클릭 시
connectButton.onclick = () => {
  const publisherId = pubIdInput.value.trim()
  if (publisherId) {
    socket.emit('subscriber-subscribe', publisherId)
  }
}

// [Sub-2] 퍼블리셔로부터 offer 수신
socket.on('publisher-offer', async ({ offer, senderId }) => {
  peerConnection = new RTCPeerConnection()

  // 수신된 미디어를 영상에 표시
  peerConnection.ontrack = (event) => {
    subVideo.srcObject = event.streams[0]
  }

  // offer → answer
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
  const answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)

  // answer 전송
  socket.emit('subscriber-send-answer', { publisherId: senderId, answer })

  // ICE 후보 전송
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { targetId: senderId, candidate: event.candidate })
    }
  }
})

// ========== [ICE Candidate 공통 처리] ==========

socket.on('ice-candidate', ({ candidate, senderId }) => {
  const pc = peerConnections[senderId] || peerConnection
  if (pc) {
    pc.addIceCandidate(new RTCIceCandidate(candidate))
  }
})