function logout() {
    localStorage.clear(); 
    alert("You have been logged out!");
    window.location.href = 'index.html';
}