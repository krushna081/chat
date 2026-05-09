import axios from 'axios';

const url = 'http://localhost:5000/api/auth/login';

axios.options(url)
  .then((res) => {
    console.log('OK', res.status);
  })
  .catch((err) => {
    console.error('ERROR FULL:', err);
    if (err.response) {
      console.error('ERROR RESPONSE', err.response.status, err.response.data);
    } else {
      console.error('ERROR MESSAGE', err.message);
    }
  });
