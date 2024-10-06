// SignUp.js
import React, { useState } from 'react';
import axios from 'axios';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // لتتبع الخطوة الحالية

  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handleSignUp = async () => {
    setLoading(true); // تفعيل شاشة التحميل

    try {
      await axios.post('http://your-server.com/api/signup', { email });
      setLoading(false); // إيقاف شاشة التحميل
      alert('تم إرسال رابط التسجيل إلى بريدك الإلكتروني.');
      handleNextStep(); // الانتقال إلى الخطوة التالية
    } catch (error) {
      setLoading(false);
      console.error('خطأ أثناء التسجيل:', error);
      alert('حدث خطأ أثناء التسجيل.');
    }
  };

  return (
    <div>
      {loading && <div className="loader">جاري التحميل...</div>}

      {step === 1 && (
        <div>
          <h2>الخطوة 1: أدخل بريدك الإلكتروني</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="أدخل بريدك الإلكتروني"
          />
          <button onClick={handleSignUp}>إرسال رابط التسجيل</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>تم إرسال البريد الإلكتروني!</h2>
          <p>تحقق من بريدك الإلكتروني واتبع التعليمات لإكمال التسجيل.</p>
        </div>
      )}
    </div>
  );
};

export default SignUp;
