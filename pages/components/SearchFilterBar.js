import {useState} from 'react';
import {getCategories, getCountries} from "@/pages/utils/utils";

const SearchFilterBar = ({onFilter, onReset}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [priceRange, setPriceRange] = useState({min: '', max: ''});
    const [condition, setCondition] = useState('');
    const [country, setCountry] = useState('');

    const categories = getCategories();
    const countries = getCountries();

    const subcategories = category ? categories[category] : [];

    const handleSearch = () => {
        onFilter({
            searchQuery,
            category,
            subcategory,
            priceRange,
            condition,
            country
        });
    };

    const handleReset = () => {
        setSearchQuery('')
        setCategory('')
        setSubcategory('')
        setPriceRange({min: '', max: ''})
        setCondition('')
        setCountry('')
        onReset();
    }

    return (
        <div className="bg-gray-100 p-4 rounded-md mb-6">
            <div className="flex flex-wrap justify-between items-center gap-2">
                <input
                    type="text"
                    placeholder="Search by title or description"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border p-2 rounded-md flex-grow min-w-[150px] sm:min-w-[200px]"
                />

                <select
                    value={category}
                    onChange={(e) => {
                        setCategory(e.target.value);
                        setSubcategory(''); // Reset subcategory when category changes
                    }}
                    className="border p-2 rounded-md flex-grow min-w-[150px]"
                >
                    <option value="">All Categories</option>
                    {Object.keys(categories).map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>

                <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    disabled={!category} // Disable if no category is selected
                    className="border p-2 rounded-md flex-grow min-w-[150px]"
                >
                    <option value="">All Subcategories</option>
                    {subcategories.map((subcat) => (
                        <option key={subcat} value={subcat}>
                            {subcat}
                        </option>
                    ))}
                </select>

                <div className="flex gap-2 flex-grow min-w-[150px] max-w-[300px] sm:min-w-[200px]">
                    <input
                        type="number"
                        placeholder="Min price"
                        value={priceRange.min}
                        onChange={(e) =>
                            setPriceRange({...priceRange, min: e.target.value})
                        }
                        className="border p-2 rounded-md w-1/2"
                    />
                    <input
                        type="number"
                        placeholder="Max price"
                        value={priceRange.max}
                        onChange={(e) =>
                            setPriceRange({...priceRange, max: e.target.value})
                        }
                        className="border p-2 rounded-md w-1/2"
                    />
                </div>

                <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="border p-2 rounded-md flex-grow min-w-[100px] sm:min-w-[150px]"
                >
                    <option value="">Any Condition</option>
                    <option value="NEW">New</option>
                    <option value="LIKE_NEW">Like New</option>
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="DAMAGED">Damaged</option>
                </select>

                <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="border p-2 rounded-md flex-grow min-w-[100px] max-w-[100px] sm:min-w-[150px]"
                >
                    <option value="">Any Country</option>
                    {countries.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleSearch}
                    className="mt-2 sm:mt-0 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex-grow min-w-[120px]"
                >
                    Search & Filter
                </button>

                <button
                    onClick={handleReset}
                    className="mt-2 sm:mt-0 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex-grow min-w-[120px]"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default SearchFilterBar;
