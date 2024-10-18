// 1. استيراد المكتبات اللازمة
import emailjs from 'emailjs-com';
import { v4 as uuidv4 } from 'uuid';

// 2. دالة إرسال الإيميل باستخدام EmailJS
const sendEmail = (userEmail, registrationLink) => {
  const templateParams = {
    email: userEmail, // الإيميل الخاص بالمستخدم
    registration_link: registrationLink, // الرابط الفريد للتسجيل
  };

  // استدعاء خدمة EmailJS لإرسال الإيميل
  emailjs.send('service_yk9jpt8', 'template_08k641g', templateParams, 'FM4EH0tJc4SLNTwBL')
    .then((response) => {
      console.log('SUCCESS!', response.status, response.text); // رسالة نجاح
    }, (error) => {
      console.error('FAILED...', error); // رسالة في حالة حدوث خطأ
    });
};

// 3. دالة توليد الرابط الفريد للمستخدم
const createUniqueLink = (userEmail) => {
  // توليد UUID فريد
  const uniqueID = uuidv4();
  
  // بناء رابط التسجيل باستخدام UUID
  const registrationLink = `https://yourapp.com/register?token=${uniqueID}`;

  // استدعاء دالة إرسال الإيميل
  sendEmail(userEmail, registrationLink);
};

// 4. اختبار الكود - استدعاء الدالة مع بيانات وهمية
createUniqueLink('test@example.com'); // هنا تجرب بإيميلك أو إيميل وهمي
