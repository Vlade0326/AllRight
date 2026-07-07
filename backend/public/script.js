async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const status = document.getElementById('status');

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            window.location.href = '/app.html';
        } else {
            const msg = typeof data.message === 'string' ? data.message : 'Credenciales inválidas';
            status.textContent = 'Error: ' + msg;
        }
    } catch {
        status.textContent = 'Error al conectar con el servidor';
    }
}
