import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import { v4 as uuidv4 } from 'uuid';
import { message } from 'antd';

const Testtt = () => {
  const [adminEmail, setAdminEmail] = useState('');

  const sendEmail = (userEmail, registrationLink) => {
    const templateParams = {
      email: userEmail,
      registration_link: registrationLink,
    };

    emailjs.send('service_xwxd76g', 'template_ot7w717', templateParams, 'TogpmdmQpVJE5hH3Y')
      .then((response) => {
        console.log('SUCCESS!', response.status, response.text);
        message.success(`Email sent to ${userEmail}`); 
      }, (error) => {
        console.error('FAILED...', error);
        message.error(`Failed to send email: ${error.message}`);
      });
  };

  const createUniqueLink = () => {
    if (!adminEmail) {
      message.error("Please enter an admin email.");
      return;
    }

    const uniqueID = uuidv4();
    const registrationLink = `https://litrix-f06e0.web.app/admin-signup?token=${uniqueID}`;
    sendEmail(adminEmail, registrationLink);  
    setAdminEmail(''); 
  };

  return (
    <div>
      <input
        type="email"
        value={adminEmail}
        onChange={(e) => setAdminEmail(e.target.value)}
        placeholder="Enter admin email"
        className="border rounded px-3 py-1 mb-2"
      />
      <button onClick={createUniqueLink} className="bg-blue-500 text-white rounded px-4 py-2">
        Send Registration Link
      </button>
    </div>
  );
};

export default Testtt;
