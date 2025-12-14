// Connect to backend
const socket = io('https://fsociety-g10b.onrender.com');

// Generate unique session ID
function getSessionId() {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

// Wait for socket connection before logging in
socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
});

function checkPassword() {
    const regularPassword = "@fsociety00";
    const adminPassword = "#Adm1n_$yn@pse!2025";
    const inputField = document.getElementById("pwd");
    const inputValue = inputField.value.trim();
    const errorMsg = document.getElementById("error-msg");

    if (inputValue === "") {
        errorMsg.textContent = "Please type something inside the input box.";
        errorMsg.style.opacity = 1;
        setTimeout(() => {
            errorMsg.style.opacity = 0;
        }, 3000);
    } else if (inputValue === adminPassword) {
        // Store login type before redirect
        const sessionId = getSessionId();
        localStorage.setItem('loginType', 'admin');
        localStorage.setItem('pendingLogin', 'true');
        window.location.href = "./admin.html";
    } else if (inputValue === regularPassword) {
        // Store login type before redirect
        const sessionId = getSessionId();
        localStorage.setItem('loginType', 'user');
        localStorage.setItem('pendingLogin', 'true');
        window.location.href = "./success.html";
    } else {
        errorMsg.textContent = "Wrong password.";
        errorMsg.style.opacity = 1;
        setTimeout(() => {
            errorMsg.style.opacity = 0;
        }, 3000);
    }
}

// Listen for kick command
socket.on('you-are-kicked', () => {
    alert('You have been kicked by an administrator!');
    localStorage.removeItem('sessionId');
    window.location.href = './index.html';
});
