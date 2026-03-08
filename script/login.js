let login = document.getElementById("login-btn")
let id = document.getElementById("name")
let pass = document.getElementById("pass")

login.addEventListener("click", function (e) {
    e.preventDefault(); // stops form reload

    if (id.value == "admin" && pass.value == "admin123") {
        window.location.href = "./dashboard.html"
    } else {
        alert("Invalid username or password")
    }
})
