// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, setAuthToken } from '../lib/auth';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Submitting', { isLogin, username });

    try {
        const fn = isLogin ? login : register;
        const data = await fn(username, password);

        console.log("Success?: Data: ", data);

        setAuthToken(data.token);
        console.log('Token saved, navigating...'); // debug
        setTimeout(() => {
          navigate('/todos');
        }, 100); // small delay to make sure that the token gets saved??
        

    } catch (err) {
        console.error("Error:", err);
        setError(err.message || "An error occured"); 
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20 }}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 10, padding: 8 }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 10, padding: 8 }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '8px 16px' }}>
          {isLogin ? 'Login' : 'Register'}
        </button>
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={{ marginLeft: 10, padding: '8px 16px' }}
        >
          Switch to {isLogin ? 'Register' : 'Login'}
        </button>
      </form>
    </div>
  );
}

