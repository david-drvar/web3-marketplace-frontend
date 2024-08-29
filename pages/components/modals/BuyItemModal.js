import {useEffect, useState} from "react";
import {Modal} from "web3uikit";
import {fetchModerators} from "@/pages/utils/apolloService";

export default function BuyItemModal({isVisible, onClose, onBuyItem}) {
    const [useModerator, setUseModerator] = useState(false);
    const [selectedModerator, setSelectedModerator] = useState(null);

    const [moderators, setModerators] = useState([]);

    useEffect(() => {
        fetchModerators().then((data) => setModerators(data));
    }, []);

    return (
        <Modal
            isVisible={isVisible}
            onCloseButtonPressed={onClose}
            title="Buy Item"
            okText={"Buy Item"}
            isOkDisabled={useModerator && !selectedModerator}
            onOk={() => onBuyItem(selectedModerator)}
            onCancel={onClose}
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
                        {moderators.map((moderator) => (
                            <div key={moderator.id} className="flex items-center mb-2">
                                <input
                                    type="radio"
                                    id={moderator.id}
                                    name="moderator"
                                    value={moderator.id}
                                    checked={selectedModerator === moderator.id}
                                    onChange={() => setSelectedModerator(moderator.id)}
                                    className="mr-2"
                                />
                                <label htmlFor={moderator.id} className="cursor-pointer">
                                    <span
                                        className="font-semibold">{`${moderator.firstName} ${moderator.lastName}`}</span>{" "}
                                    (@{moderator.username}) - <span
                                    className="text-gray-600">{moderator.description}</span>
                                </label>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </Modal>
    );
}
