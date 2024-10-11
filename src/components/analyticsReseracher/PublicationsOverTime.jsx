import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { GridLoader } from 'react-spinners';

const UserRetention = () => {
  const [data, setData] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState("Yearly");
  const [loading, setLoading] = useState(true);
  const [scholarId, setScholarId] = useState(null);
  const [college, setCollege] = useState(null);
  const [department, setDepartment] = useState(null);

  const fetchUserData = async (uid) => {
    try {
      const userDocRef = doc(db, `users/${uid}`);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return { scholar_id: userData.scholar_id, college: userData.college, department: userData.department };
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
    }
    return null;
  };

  const fetchPublicationsByRange = async (scholarId, college, department) => {
    setLoading(true);
    try {
      const publicationsRef = collection(db, `colleges/${college}/departments/${department}/faculty_members/${scholarId}/publications`);
      const publicationsSnapshot = await getDocs(publicationsRef);

      const publicationsByRange = {};

      publicationsSnapshot.forEach(doc => {
        const publication = doc.data();
        const pubYear = publication.pub_year;

        if (selectedTimeRange === "Yearly") {
          if (!publicationsByRange[pubYear]) {
            publicationsByRange[pubYear] = 1;
          } else {
            publicationsByRange[pubYear] += 1;
          }
        }
      });

      const formattedData = Object.keys(publicationsByRange)
        .sort((a, b) => a - b)
        .map(year => ({
          name: year,
          publications: publicationsByRange[year]
        }));

      setData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching publications: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userData = await fetchUserData(user.uid);
        if (userData) {
          setScholarId(userData.scholar_id);
          setCollege(userData.college);
          setDepartment(userData.department);
          fetchPublicationsByRange(userData.scholar_id, userData.college, userData.department);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedTimeRange]);

  const handleTimeRangeChange = (e) => {
    setSelectedTimeRange(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <GridLoader size={15} color={"#4F46E5"} loading={true} />
      </div>
    );
  }

  return (
    <motion.div
      className='bg-white shadow-lg rounded-xl p-6 border border-gray-300'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4'>Research Publications Over Time</h2>

      <div className="mb-4">
        <select value={selectedTimeRange} onChange={handleTimeRangeChange} className="border rounded px-3 py-1 text-gray-700">
          <option value="Yearly">Yearly</option>
          <option value="Monthly">Monthly</option>
          <option value="Weekly">Weekly</option>
        </select>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray='3 3' stroke='#ccc' />
            <XAxis dataKey='name' stroke='#333' />
            <YAxis stroke='#333' />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderColor: "#ccc",
                color: "#333",
              }}
              itemStyle={{ color: "#333" }}
            />
            <Legend verticalAlign="top" height={36} />
            <Line type='monotone' dataKey='publications' stroke='#4F46E5' strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default UserRetention;
