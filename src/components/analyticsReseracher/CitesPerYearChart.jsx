import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { doc, getDoc } from "firebase/firestore"; 
import { db } from "../../firebaseConfig"; 
import { ClipLoader } from 'react-spinners';  // استيراد ClipLoader من react-spinners

const CitesPerYearChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // وظيفة جلب بيانات الاقتباسات لكل سنة
  const fetchCitesPerYear = async () => {
    try {
      const docRef = doc(db, "colleges/faculty_computing/departments/dept_cs/faculty_members/JSQbyBgAAAAJ");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const researcherData = docSnap.data();
        const citesPerYear = researcherData.cites_per_year;

        const formattedData = Object.keys(citesPerYear).map((year) => ({
          year: parseInt(year),
          cites: citesPerYear[year],
        }));

        setData(formattedData);
      } else {
        console.error("No such document!");
      }
    } catch (error) {
      console.error("Error fetching cites_per_year:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitesPerYear();
  }, []);

  if (loading) {
    // عرض ClipLoader أثناء التحميل
    return (
      <div className="flex justify-center items-center h-screen">
        <ClipLoader size={150} color={"#123abc"} loading={true} />
      </div>
    );
  }

  return (
    <motion.div
      className='bg-white shadow-lg rounded-xl p-6 border border-gray-300 mb-8'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className='text-xl font-semibold text-gray-900 mb-4'>Citations Per Year</h2>

      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray='3 3' stroke='#ccc' />
            <XAxis dataKey='year' stroke='#333' />
            <YAxis stroke='#333' />
            <Tooltip
              contentStyle={{ backgroundColor: "white", borderColor: "#ccc", color: "#333" }}
              itemStyle={{ color: "#333" }}
            />
            <Legend />
            <Bar dataKey='cites' fill='#4da7d0' barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default CitesPerYearChart;
