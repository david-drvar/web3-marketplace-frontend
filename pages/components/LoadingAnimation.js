import {Loading} from "web3uikit";

const LoadingAnimation = () => (
    <div className="flex justify-center items-center h-screen">
        <Loading
            size={80}
            spinnerColor="#2E7DAF"
        />
    </div>
);

export default LoadingAnimation;