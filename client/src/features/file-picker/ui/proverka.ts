import axios from 'axios';

const url = 'http://84.201.152.196:8020/v1/completions';

const headers = {
    'Authorization': 'leQ0NieMkgtPvzC0lZu5iGy8mXiTec7B',
    'Content-Type': 'application/json',
};

const data = {
    model: 'mistral-nemo-instruct-2407',
    messages: [
        {
            role: 'system',
            content: 'отвечай на русском языке',
        },
        {
            role: 'user',
            content: 'Как дела?',
        },
    ],
    max_tokens: 1000,
    temperature: 0.3,
};

axios.post(url, data, { headers })
    .then(response => {
        console.log('Response:', response.data);
    })
    .catch(error => {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    });
