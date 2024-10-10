import Header from "../components/common/Header"; 
import RevenueChart from "../components/analyticsReseracher/CitesPerYearChart";
import ChannelData from "../components/analyticsReseracher/ChannelData";
import Data from "../components/analyticsReseracher/PublicationsOverTime";

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
