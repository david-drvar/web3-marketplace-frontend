import {useEffect, useState} from "react";
import {Modal} from "web3uikit";
import {fetchModerators} from "@/pages/utils/apolloService";
import {getUserAddresses} from "@/pages/utils/firebaseService";
import {useMoralis} from "react-moralis";

export default function BuyItemModal({isVisible, onClose, onBuyItem}) {
    const [useModerator, setUseModerator] = useState(false);
    const [selectedModerator, setSelectedModerator] = useState(null);
    const [moderators, setModerators] = useState([]);

    const {account} = useMoralis();

    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(-1);

    useEffect(() => {
        fetchModerators().then((data) => setModerators(data));
        getUserAddresses(account).then((data) => setAddresses(data));
    }, [account]);

    return (
        <Modal
            isVisible={isVisible}
            onCloseButtonPressed={onClose}
            title="Buy Item"
            okText={"Buy Item"}
            isOkDisabled={(useModerator && !selectedModerator) || selectedAddress === -1}
            onOk={() => onBuyItem(selectedModerator, addresses[selectedAddress])}
            onCancel={onClose}
            size="lg"
        >
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-lg">Would you like to have a moderator in your order?</p>
                    <input
                        type="checkbox"
                        checked={useModerator}
                        onChange={(e) => setUseModerator(e.target.checked)}
                        className="w-5 h-5"
                    />
                </div>

                {useModerator && (
                    <div className="overflow-y-scroll h-48 border border-gray-300 p-2 rounded-lg">
                        <p className="font-semibold mb-2">Select a Moderator:</p>
                        <ul className="space-y-2">
                            {moderators.map((moderator) => (
                                <li
                                    key={moderator.id}
                                    className={`flex items-center p-4 bg-gray-100 rounded-lg ${selectedModerator === moderator.id ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        id={moderator.id}
                                        name="moderator"
                                        value={moderator.id}
                                        checked={selectedModerator === moderator.id}
                                        onChange={() => setSelectedModerator(moderator.id)}
                                        className="mr-3 h-4 w-4"
                                    />
                                    <img
                                        src={`${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${moderator.avatarHash}?pinataGatewayToken=${process.env.NEXT_PUBLIC_GATEWAY_TOKEN}`}
                                        alt={`${moderator.firstName} ${moderator.lastName}`}
                                        className="w-10 h-10 rounded-full mr-3"
                                    />
                                    <label htmlFor={moderator.id} className="flex-1 cursor-pointer">
                                        <div
                                            className="font-semibold">{`${moderator.firstName} ${moderator.lastName}`}</div>
                                        <div className="text-gray-600">@{moderator.username}</div>
                                        <div className="text-gray-500 text-sm">{moderator.description}</div>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}


                {/* Address Selection Section */}
                {addresses.length > 0 ? (
                    <div className="overflow-y-scroll h-48 border border-gray-300 p-2 rounded-lg">
                        <p className="font-semibold mb-2">Select an Address:</p>
                        <ul className="space-y-2">
                            {addresses.map((address, index) => (
                                <li
                                    key={index}
                                    className={`flex items-center p-4 bg-gray-100 rounded-lg ${selectedAddress === address.id ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        id={`address-${index}`}
                                        name="address"
                                        value={address.id}
                                        checked={selectedAddress === address.id}
                                        onChange={() => setSelectedAddress(address.id)}
                                        className="mr-3 h-4 w-4"
                                    />
                                    <label htmlFor={`address-${index}`} className="flex-1 cursor-pointer">
                                        <div><strong>Country:</strong> {address.country}</div>
                                        <div><strong>City:</strong> {address.city}</div>
                                        <div><strong>Street:</strong> {address.street}</div>
                                        <div><strong>Zip Code:</strong> {address.zipCode}</div>
                                        <div><strong>Phone Number:</strong> {address.phoneNumber}</div>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="border border-red-500 p-4 rounded-lg bg-red-100 mt-4">
                        <p className="text-red-600">
                            You need to enter an address in your profile section before you can continue with the
                            purchase.
                        </p>
                    </div>
                )}

            </div>
        </Modal>
    );
}
