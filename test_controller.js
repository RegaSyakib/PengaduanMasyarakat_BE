const { updateProfile } = require('./controllers/userController');

// Mock request
const req = {
    user: { id: 23 }, // tester@example.com is ID 23
    body: { name: 'Tester Updated', email: 'tester@example.com' },
    file: { filename: 'dummy.jpg', path: 'uploads/dummy.jpg' }
};

// Mock response
const res = {
    status: function(code) {
        console.log('STATUS:', code);
        return this;
    },
    json: function(data) {
        console.log('JSON RESPONSE:', data);
    }
};

async function run() {
    console.log('Running mock updateProfile...');
    try {
        await updateProfile(req, res);
    } catch (e) {
        console.error('OUTER EXCEPTION:', e);
    }
}

run();
