import { FormEvent, useState } from 'react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  async function login(e: FormEvent) {
    e.preventDefault();
    setStatus('');

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        window.location.href = '/app.html';
      } else {
        const msg = typeof data.message === 'string' ? data.message : 'Credenciales inválidas';
        setStatus('Error: ' + msg);
      }
    } catch {
      setStatus('Error al conectar con el servidor');
    }
  }

  return (
    <div className="s25-frame">
      <div className="camera-notch" />
      <div className="screen">
        <form className="login-box" onSubmit={login}>
          <h1>AllRight</h1>
          <p>Inicia sesión para continuar</p>
          <input
            type="email"
            placeholder="Correo electrónico"
            data-testid="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            data-testid="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" data-testid="login-btn">
            Ingresar
          </button>
          <p className="status" data-testid="status">
            {status}
          </p>
        </form>
      </div>
    </div>
  );
}
