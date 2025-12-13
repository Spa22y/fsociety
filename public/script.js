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
        // Log admin access
        const sessionId = getSessionId();
        socket.emit('user-login', {
            sessionId: sessionId,
            userType: 'Admin',
            isAdmin: true
        });
        
        setTimeout(() => {
            window.location.href = "./admin.html";
        }, 200);
    } else if (inputValue === regularPassword) {
        // Log regular user access
        const sessionId = getSessionId();
        socket.emit('user-login', {
            sessionId: sessionId,
            userType: 'User',
            isAdmin: false
        });
        
        setTimeout(() => {
            window.location.href = "./success.html";
        }, 200);
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
