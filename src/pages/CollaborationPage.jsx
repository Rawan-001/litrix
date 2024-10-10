import React from 'react';
import Header from '../components/common/Header'; // تأكد من أن مسار الهيدر صحيح

const LitrixChatPage = () => {
  return (
    <div className="flex-1 relative z-10 overflow-auto">
      <Header title="Collaboration" />

      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Welcome to Collaboration Page!</h2>
      </div>
    </div>
  );
};

export default LitrixChatPage;
