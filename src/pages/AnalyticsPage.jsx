import Header from "../components/common/Header"; 
import RevenueChart from "../components/analytics/RevenueChart";
import ChannelData from "../components/analytics/ChannelData";
import Data from "../components/analytics/Data";

const AnalyticsPage = () => {
  return (
    <div className="flex-1 overflow-auto relative z-10 bg-white text-gray-800">
      <Header title="Analytics " />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <RevenueChart />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ChannelData />
          <Data />
        </div>

      </main>
    </div>
  );
};

export default AnalyticsPage;
