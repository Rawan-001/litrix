import { useState } from "react";
import SettingSection from "./SettingSection";
import { HelpCircle, Plus } from "lucide-react";

const ConnectedAccounts = () => {
  const [connectedAccounts, setConnectedAccounts] = useState([
    {
    }
  ]);

  return (
    <SettingSection icon={HelpCircle} title={""}>
      {connectedAccounts.map((account) => (
        <div key={account.id} className='flex items-center justify-between py-3'>
          <div className='flex gap-1'>
            <img src={account.icon} alt='Social img' className='size-6 object-cover rounded-full mr-2' />
            <span className='text-gray-800'>{account.name}</span> {/* غيرنا اللون إلى رمادي داكن */}
          </div>
          <button
            className={`px-3 py-1 rounded ${
              account.connected ? "bg-green-500 hover:bg-green-600" : "bg-gray-300 hover:bg-gray-400"
            } transition duration-200`}
            onClick={() => {
              setConnectedAccounts(
                connectedAccounts.map((acc) => {
                  if (acc.id === account.id) {
                    return {
                      ...acc,
                      connected: !acc.connected,
                    };
                  }
                  return acc;
                })
              );
            }}
          >
            {account.connected ? "Connected" : "Connect"}
          </button>
        </div>
      ))}
      <button className='mt-4 flex items-center text-blue-600 hover:text-blue-500 transition duration-200'>
        <Plus size={18} className='mr-2' /> Add Account
      </button>
    </SettingSection>
  );
};

export default ConnectedAccounts;
