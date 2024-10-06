const ToggleSwitch = ({ label, isOn, onToggle }) => {
	return (
	  <div className='flex items-center justify-between py-3'>
		<span className='text-gray-800'>{label}</span> {/* تعديل لون النص */}
		<button
		  className={`
		  relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none
		  ${isOn ? "bg-indigo-500" : "bg-gray-300"} /* تعديل الألوان */
		  `}
		  onClick={onToggle}
		>
		  <span
			className={`inline-block size-4 transform transition-transform bg-white rounded-full 
			  ${isOn ? "translate-x-6" : "translate-x-1"}
			  `}
		  />
		</button>
	  </div>
	);
  };
  export default ToggleSwitch;
  