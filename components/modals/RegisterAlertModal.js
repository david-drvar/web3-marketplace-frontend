import Modal from "react-modal";
import {useRouter} from "next/router";

export default function RegisterAlertModal({isVisible, onClose}) {
    const router = useRouter();

    const handeRedirection = () => {
        router.push({pathname: `/profile`});
    }

    const handleClose = () => {
        onClose();
    }

    return (
        <Modal
            appElement={document.getElementById('__next')}
            isOpen={isVisible}
            className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto min-w-[700px] relative"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
        >
            <div>

                <div className="flex flex-col items-center text-center">
                    <h2 className="text-2xl font-semibold mb-4">Register first</h2>
                    <div className="border border-red-500 p-4 rounded-lg bg-red-100 mb-4">
                        <p className="text-xl text-red-600">
                            You need to register your account before you perform any activities.
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4 mt-2">
                    {/* Close Button */}
                    <button
                        className={`px-4 py-2 rounded-lg bg-gray-300 text-gray-800`}
                        onClick={handleClose}
                    >
                        Close
                    </button>

                    {/* Redirect Button */}
                    <button
                        className={`px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white`}
                        onClick={handeRedirection}
                    >
                        Got to profile registration
                    </button>
                </div>
            </div>

        </Modal>
    );
}
