import React from 'react';
import emailjs from 'emailjs-com';
import { v4 as uuidv4 } from 'uuid';

const App = () => {
  const sendEmail = (userEmail, registrationLink) => {
    const templateParams = {
      email: userEmail,
      registration_link: registrationLink,
    };

    emailjs.send('service_yk9jpt8', 'template_08k641g', templateParams, 'FM4EH0tJc4SLNTwBL')
      .then((response) => {
        console.log('SUCCESS!', response.status, response.text);
      }, (error) => {
        console.error('FAILED...', error);
      });
  };

  const createUniqueLink = () => {
    const uniqueID = uuidv4();
    const registrationLink = `https://litrix-f06e0.web.app/admin-signup?token=${uniqueID}`;
    sendEmail('ra20awn@gmail.com', registrationLink);  
  };

  return (
    <div>
      <button onClick={createUniqueLink}>إرسال رابط التسجيل</button>
    </div>
  );
};

export default App;
