import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig'; 
import { doc, setDoc } from 'firebase/firestore'; 

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [scholarId, setScholarId] = useState('');  
  const [role, setRole] = useState('researcher'); 
  const navigate = useNavigate();

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, `users/${user.uid}`);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: email,
        scholarId: scholarId,
        role: role, 
      });

      alert('Account created successfully with role!');
      navigate('/login');
    } catch (error) {
      alert(`Sign Up failed: ${error.message}`);
    }
  };

  const redirectToLogin = () => {
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Google Scholar ID"
          value={scholarId}
          onChange={(e) => setScholarId(e.target.value)}
          style={styles.input}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
          <option value="researcher">Researcher</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={handleSignUp} style={styles.button}>Sign Up</button>

        <p style={styles.text}>
        Do you already have an account?
        {' '}
          <span onClick={redirectToLogin} style={styles.link}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
  },
  card: {
    width: '400px',
    padding: '30px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  select: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: 'LightBlue',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
    width: '100%',
  },
  text: {
    marginTop: '20px',
    color: '#333',
  },
  link: {
    color: '#007BFF',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default SignUpPage;
