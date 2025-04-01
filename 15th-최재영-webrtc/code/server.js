const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let peers = {}; // pubId -> socket.id 매핑

io.on('connection', (socket) => {
  console.log('🟢 사용자 연결됨:', socket.id);

  // [Pub-1] 퍼블리셔 등록 요청 처리
  socket.on('publisher-register', () => {
    const pubId = uuidv4();
    peers[pubId] = socket.id;

    // [Pub-2] 발급된 퍼블리셔 ID 전달
    socket.emit('publisher-id-assigned', pubId);
    console.log('📡 퍼블리셔 등록 완료:', pubId);
  });

  // [Sub-1] 구독자가 특정 퍼블리셔에게 구독 요청
  socket.on('subscriber-subscribe', (pubId) => {
    const publisherSocketId = peers[pubId];

    if (publisherSocketId) {
      // [Pub-3] 퍼블리셔에게 구독자의 offer 요청 전달
      socket.to(publisherSocketId).emit('subscriber-offer-request', socket.id);
      console.log(`🔄 구독자(${socket.id}) → 퍼블리셔(${publisherSocketId}) offer 요청`);
    } else {
      socket.emit('error', '❌ 해당 퍼블리셔를 찾을 수 없습니다.');
    }
  });

  // [Pub-4] 퍼블리셔가 구독자에게 offer 전송
  socket.on('publisher-send-offer', ({ subscriberId, offer }) => {
    socket.to(subscriberId).emit('publisher-offer', { offer, senderId: socket.id });
    console.log(`📨 퍼블리셔(${socket.id}) → 구독자(${subscriberId}) offer 전송`);
  });

  // [Sub-2] 구독자가 퍼블리셔에게 answer 전송
  socket.on('subscriber-send-answer', ({ publisherId, answer }) => {
    socket.to(publisherId).emit('subscriber-answer', { answer, senderId: socket.id });
    console.log(`📨 구독자(${socket.id}) → 퍼블리셔(${publisherId}) answer 전송`);
  });

  // [Pub/Sub-3] ICE candidate 중계
  socket.on('ice-candidate', ({ targetId, candidate }) => {
    socket.to(targetId).emit('ice-candidate', { candidate, senderId: socket.id });
    console.log(`❄️ ICE candidate: ${socket.id} → ${targetId}`);
  });

  // [공통] 연결 해제 시 퍼블리셔 목록 정리
  socket.on('disconnect', () => {
    console.log('🔴 사용자 연결 종료:', socket.id);
    Object.keys(peers).forEach((pubId) => {
      if (peers[pubId] === socket.id) {
        console.log(`🗑 퍼블리셔 제거됨: ${pubId}`);
        delete peers[pubId];
      }
    });
  });
});

server.listen(3011, () => {
  console.log('🚀 서버 실행 중: http://localhost:3011');
});