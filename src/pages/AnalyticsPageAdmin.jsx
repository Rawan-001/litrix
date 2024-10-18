import { useState, useEffect } from 'react';
import Header from "../components/common/Header"; 
import CitesPerYearChartAdmin from "../components/analyticsAdmin/CitesPerYearChartAdmin";
import PublicationsOverTimeAdmin from "../components/analyticsAdmin/PublicationsOverTimeAdmin";
import PieChartAdmin from "../components/analyticsAdmin/PieChartAdmin";
import { GridLoader } from 'react-spinners';

const departments = [
  { value: "dept_cs", label: "Computer Science" },
  { value: "dept_it", label: "Information Technology" },
  { value: "dept_se", label: "Software Engineering" },
  { value: "dept_sn", label: "Network Systems" },
];

const AnalyticsPageAdmin = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("dept_cs");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(false);
    };
    loadData();
  }, [selectedDepartment]);

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <GridLoader size={30} color={"#123abc"} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-white text-gray-800">
      <Header title="Analytics" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <div className="mb-8">
          <label htmlFor="department-select" className="block text-sm font-medium text-gray-700">
            Select Department:
          </label>
          <select
            id="department-select"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            className="mt-1 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {departments.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-8">
          <PublicationsOverTimeAdmin selectedDepartment={selectedDepartment} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-8"> 
          <CitesPerYearChartAdmin selectedDepartment={selectedDepartment} />
          <PieChartAdmin selectedDepartment={selectedDepartment} />
        </div>

      </main>
    </div>
  );
};

export default AnalyticsPageAdmin;
