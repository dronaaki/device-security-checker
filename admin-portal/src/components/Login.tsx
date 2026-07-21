import { Shield } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

export function Login() {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Failed to login. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-box animate-in">
        <Shield size={48} color="var(--accent-color)" style={{ margin: '0 auto 1.5rem' }} />
        <h1>Security Admin</h1>
        <p style={{ marginBottom: '2rem' }}>Authenticate to access the backend dashboard.</p>
        <button className="btn" onClick={handleLogin} style={{ width: '100%' }}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
