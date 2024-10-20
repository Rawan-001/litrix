import React, { useEffect, useState } from "react";
import { User } from "lucide-react";
import SettingSection from "./SettingSection";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const Profile = () => {
  const [userData, setUserData] = useState(null); 

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data()); 
        }
      }
    };

    fetchUserData();
  }, []);

  return (
    <SettingSection icon={User} title={"Profile"}>
      {userData ? (
        <div className="flex flex-col sm:flex-row items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {userData.firstName} {userData.lastName} 
            </h3>
            <p className="text-gray-600">{userData.email}</p> 
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </SettingSection>
  );
};

export default Profile;
