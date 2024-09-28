import {useMoralis} from "react-moralis";
import {useRouter} from "next/router";
import {useEffect, useState} from "react";


export default function UserPage() {
    const {isWeb3Enabled, account} = useMoralis();
    const router = useRouter();

    const id = router.query.id;
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, [account])
    return (
        <>

        </>
    )
}