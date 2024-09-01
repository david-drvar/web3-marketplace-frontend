import {useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {setUser} from "@/store/slices/userSlice";
import {getCountries} from "@/pages/utils/utils";

export default function ManageAddresses() {
    const user = useSelector((state) => state.user);
    const dispatchState = useDispatch();

    const [addresses, setAddresses] = useState(user.addresses || []);
    const [formData, setFormData] = useState({
        country: "",
        city: "",
        street: "",
        zipCode: "",
        phoneNumber: "",
    });
    const [editingIndex, setEditingIndex] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSaveAddress = () => {
        if (editingIndex !== null) {
            // Update existing address
            const updatedAddresses = addresses.map((address, index) =>
                index === editingIndex ? formData : address
            );
            setAddresses(updatedAddresses);
        } else {
            // Add new address
            setAddresses([...addresses, formData]);
        }
        setFormData({country: "", city: "", street: "", zipCode: "", phoneNumber: ""});
        setEditingIndex(null);
        setIsSubmitting(false);

        // Save addresses to the state/store
        dispatchState(setUser({...user, addresses}));
    };

    const handleEditAddress = (index) => {
        setEditingIndex(index);
        setFormData(addresses[index]);
    };

    const handleDeleteAddress = (index) => {
        const updatedAddresses = addresses.filter((_, i) => i !== index);
        setAddresses(updatedAddresses);

        // Update the store
        dispatchState(setUser({...user, addresses: updatedAddresses}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        handleSaveAddress();
    };

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Manage Addresses</h1>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                    <select
                        name="country"
                        id="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                        required
                    >
                        <option value="">Select your country</option>
                        {getCountries().map((country) => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City
                    </label>
                    <input
                        type="text"
                        name="city"
                        id="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="City"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                        Street
                    </label>
                    <input
                        type="text"
                        name="street"
                        id="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Street"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                        Zip Code
                    </label>
                    <input
                        type="text"
                        name="zipCode"
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Zip Code"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                        Phone Number
                    </label>
                    <input
                        type="text"
                        name="phoneNumber"
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="mt-1 p-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Phone Number"
                        required
                    />
                </div>

                <div>
                    <button
                        disabled={isSubmitting}
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        {editingIndex !== null ? "Update Address" : "Add Address"}
                    </button>
                </div>
            </form>

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Saved Addresses</h2>
                {addresses.length === 0 ? (
                    <p>No addresses saved.</p>
                ) : (
                    <ul className="space-y-4">
                        {addresses.map((address, index) => (
                            <li key={index} className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
                                <div>
                                    <p><strong>Country:</strong> {address.country}</p>
                                    <p><strong>City:</strong> {address.city}</p>
                                    <p><strong>Street:</strong> {address.street}</p>
                                    <p><strong>Zip Code:</strong> {address.zipCode}</p>
                                    <p><strong>Phone Number:</strong> {address.phoneNumber}</p>
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => handleEditAddress(index)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAddress(index)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
