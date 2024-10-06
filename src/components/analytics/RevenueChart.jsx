import { useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const revenueData = [
	{ month: "January", revenue: 400,  },
	{ month: "February", revenue: 150,  },
	{ month: "March", revenue: 301 },
	{ month: "April", revenue: 100, },
	{ month: "May", revenue: 209, },
	{ month: "June", revenue: 65,  },
	{ month: "July", revenue: 40 },
];

const RevenueChart = () => {
	const [selectedTimeRange, setSelectedTimeRange] = useState("This Month");

	return (
		<motion.div
			className='bg-white shadow-lg rounded-xl p-6 border border-gray-300 mb-8'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.2 }}
		>
			<div className='flex justify-between items-center mb-6'>
				<h2 className='text-xl font-semibold text-gray-900'>Number of Citations
				</h2>
				<select
					className='bg-gray-200 text-gray-900 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
					value={selectedTimeRange}
					onChange={(e) => setSelectedTimeRange(e.target.value)}
				>
					<option>This Week</option>
					<option>This Month</option>
					<option>This Quarter</option>
					<option>This Year</option>
				</select>
			</div>

			<div style={{ width: "100%", height: 400 }}>
				<ResponsiveContainer>
					<AreaChart data={revenueData}>
						<CartesianGrid strokeDasharray='3 3' stroke='#E5E7EB' />
						<XAxis dataKey='month' stroke='#374151' />
						<YAxis stroke='#374151' />
						<Tooltip
							contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderColor: "#D1D5DB" }}
							itemStyle={{ color: "#374151" }}
						/>
						<Legend />
						<Area type='monotone' dataKey='revenue' stroke='#4F46E5' fill='#4F46E5' fillOpacity={0.3} />
						<Area type='monotone' dataKey='target' stroke='#10B981' fill='#10B981' fillOpacity={0.3} />
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</motion.div>
	);
};

export default RevenueChart;
