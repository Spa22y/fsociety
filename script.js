function checkPassword() {
    const regularPassword = "@fsociety00";
    const adminPassword = "#Adm1n_$yn@pse!2025"; // Hard to guess admin password
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
        logAccess("Admin", true);
        window.location.href = "./admin.html";
    } else if (inputValue === regularPassword) {
        // Log regular user access
        logAccess("User", false);
        window.location.href = "./success.html";
    } else {
        errorMsg.textContent = "Wrong password.";
        errorMsg.style.opacity = 1;
        setTimeout(() => {
            errorMsg.style.opacity = 0;
        }, 3000);
    }
}

function logAccess(userType, isAdmin) {
    const now = new Date();
    const timestamp = now.toLocaleString();
    
    // Get existing logs
    let accessLogs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
    
    // Add new log entry
    accessLogs.push({
        type: userType,
        timestamp: timestamp,
        isAdmin: isAdmin
    });
    
    // Save back to localStorage
    localStorage.setItem('accessLogs', JSON.stringify(accessLogs));
}

function logGameAccess(gameName) {
    const now = new Date();
    const timestamp = now.toLocaleString();
    
    // Get existing game logs
    let gameLogs = JSON.parse(localStorage.getItem('gameLogs') || '[]');
    
    // Add new game access
    gameLogs.push({
        game: gameName,
        timestamp: timestamp
    });
    
    // Save back to localStorage
    localStorage.setItem('gameLogs', JSON.stringify(gameLogs));
}