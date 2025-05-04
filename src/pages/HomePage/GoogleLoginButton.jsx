import React, { useState } from 'react';
import { Button, notification, Spin } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

export default function GoogleLoginButton({ onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (isLoading) return;            // منع استدعاء مزدوج
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      // 1) إذا في مستخدم حالياً، نسجّل خروجه أولاً
      if (auth.currentUser) {
        await signOut(auth);
      }

      // 2) نفتح نافذة تسجيل جوجل
      const result = await signInWithPopup(auth, provider);
      const { user } = result;

      const userRef = doc(db, "users", user.uid);
      let userSnap = await getDoc(userRef);

      // 3) إذا ما فيه وثيقة للمستخدم، ننشئ وحدة جديدة
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          isProfileComplete: false
        });
  
      
        
      }

      // 4) بعد الإنشاء أو الوجوْد، نجيب أحدث الـ snapshots لكل دور
      const [adminSnap, academicSnap, departmentSnap] = await Promise.all([
        getDoc(doc(db, "admins", user.uid)),
        getDoc(doc(db, "academicAdmins", user.uid)),
        getDoc(doc(db, "departmentAdmins", user.uid))
      ]);
      // إذا التوثيق تم بنجاح، نمرّر البيانات للأب
      if (onSuccess) {
        userSnap = await getDoc(userRef); // حدث الـ snapshot
        onSuccess({ adminSnap, academicSnap, departmentSnap, userSnap, user });
      }

    } catch (error) {
      console.error("Google login error:", error);
      let description = 'Google login failed. Please try again.';
      if (error.code === 'auth/popup-closed-by-user') {
        description = 'Login popup was closed before completion.';
      } else if (error.code === 'auth/popup-blocked') {
        description = 'Login popup was blocked. Please allow popups for this site.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        description = 'An account already exists with the same email but different sign-in credentials.';
      }
      notification.error({
        message: 'Login Failed',
        description,
        duration: 4
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      block
      icon={<GoogleOutlined />}
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="google-login-button"
    >
      {isLoading ? <Spin size="small" /> : 'Continue with Google'}
    </Button>
  );
}
