import 'dotenv/config';
import axios from 'axios';

const url = process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '/api/auth/login') : 'http://localhost:5000/api/auth/login';
const payload = {
  email: 'testuser@example.com',
  password: 'P@ssw0rd123',
};

async function testLogin() {
  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    console.log('status', response.status);
    console.log('response', response.data);
  } catch (error) {
    console.error('login error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

testLogin();
