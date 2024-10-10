import Header from "../components/common/Header";
import SearchTable from "../components/search/SearchTable";


const SearchPage = () => {
	return (
		<div className='flex-1 overflow-auto relative z-10'>
			<Header title='Search' />
			<main className='max-w-7xl mx-auto py-6 px-4 lg:px-8'>	
				<SearchTable />
			</main>
		</div>
	);
};
export default SearchPage;
