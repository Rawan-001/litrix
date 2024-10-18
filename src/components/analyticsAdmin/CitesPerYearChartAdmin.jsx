import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { GridLoader } from 'react-spinners';

const CitesPerYearChartDepartment = ({ selectedCollege, selectedDepartment }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب بيانات الاستشهادات لكل قسم
  const fetchCitesPerYearByDepartment = async (college, department) => {
    setLoading(true);
    try {
      const facultyRef = collection(db, `colleges/${college}/departments/${department}/faculty_members`);
      const facultySnapshot = await getDocs(facultyRef);

      let citesPerYear = {};

      // حساب الاستشهادات لكل عام
      facultySnapshot.forEach((facultyDoc) => {
        const facultyData = facultyDoc.data();
        const facultyCitesPerYear = facultyData.cites_per_year || {};

        // تحديث بيانات الاستشهادات للسنة المحددة
        for (const year in facultyCitesPerYear) {
          citesPerYear[year] = (citesPerYear[year] || 0) + facultyCitesPerYear[year];
        }
      });

      // تحويل البيانات لشكل مناسب للرسم البياني
      const formattedData = Object.keys(citesPerYear)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map((year) => ({
          year: parseInt(year),
          cites: citesPerYear[year],
        }));

      console.log("Formatted Data:", formattedData); // للتأكد من البيانات
      setData(formattedData);
    } catch (error) {
      console.error("Error fetching cites_per_year by department:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCollege && selectedDepartment) {
      fetchCitesPerYearByDepartment(selectedCollege, selectedDepartment);
    }
  }, [selectedCollege, selectedDepartment]);

  // عرض لودر عند التحميل
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <GridLoader size={15} color={"#123abc"} loading={true} />
      </div>
    );
  }

  // عرض رسالة في حال عدم وجود بيانات
  if (!data || data.length === 0) {
    return <div>No citation data available for this department.</div>;
  }

  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl p-6 border border-gray-300 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Citations Per Year for Department</h2>

      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis dataKey="year" stroke="#333" />
            <YAxis stroke="#333" />
            <Tooltip
              contentStyle={{ backgroundColor: "white", borderColor: "#ccc", color: "#333" }}
              itemStyle={{ color: "#333" }}
            />
            <Legend />
            <Bar dataKey="cites" fill="#4da7d0" barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default CitesPerYearChartDepartment;
