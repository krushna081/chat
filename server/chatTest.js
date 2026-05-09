import axios from 'axios';

const baseUrl = 'http://localhost:5000/api';

async function run() {
  try {
    const loginRes = await axios.post(`${baseUrl}/auth/login`, {
      email: 'testuser@example.com',
      password: 'P@ssw0rd123',
    });
    console.log('login:', loginRes.status, loginRes.data);
    const token = loginRes.data.accessToken;

    const createRes = await axios.post(
      `${baseUrl}/chat/create-room`,
      { roomName: 'API Test Room', messageExpiry: '24h', password: '' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('create room:', createRes.status, createRes.data);

    const roomsRes = await axios.get(`${baseUrl}/chat/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('rooms:', roomsRes.status, roomsRes.data.chatRooms.length);
    console.log(roomsRes.data.chatRooms.map((r) => ({ roomId: r.roomId, roomName: r.roomName }))); 
  } catch (error) {
    console.error('error:', error.response ? error.response.data : error.message);
  }
}

run();
