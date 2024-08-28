import Link from "next/link";
import {useRouter} from "next/router";
import {useMoralis} from "react-moralis";
import {ConnectButton, Dropdown} from "web3uikit";

export default function Header() {
    const {isWeb3Enabled} = useMoralis();
    const router = useRouter();

    const handleChange = (event) => {
        if (event.id === "orders") {
            router.push("/my-orders");
        } else if (event.id === "home") {
            router.push("/");
        } else if (event.id === "items") {
            router.push("/my-items");
        }
    };

    return (
        <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
            <Link href="/">
                <h1 className="py-4 px-4 font-bold text-3xl">DecentWear</h1>
            </Link>

            <div className="flex flex-row items-center">
                <Link href="/" className="mr-4 p-6">
                    Home
                </Link>
                <Link href="/list-item" className="mr-4 p-6">
                    List item
                </Link>
                <Link href="/my-orders" className="mr-4 p-6">
                    My orders
                </Link>
                <Link href="/my-items" className="mr-4 p-6">
                    My items
                </Link>
                <Link href="/moderated-items" className="mr-4 p-6">
                    Moderated items
                </Link>
                <Link href="/profile" className="mr-4 p-6">
                    Profile
                </Link>
                <div>
                    <ConnectButton moralisAuth={false}/>
                </div>
                {/*{isWeb3Enabled ? (*/}
                {/*  <div>*/}
                {/*    <Dropdown*/}
                {/*      // icon={<SvgDownload fontSize={24} />}*/}
                {/*      width="800"*/}
                {/*      defaultOptionIndex={0}*/}
                {/*      onChange={handleChange}*/}
                {/*      onComplete={function noRefCheck() {}}*/}
                {/*      options={[*/}
                {/*        {*/}
                {/*          id: "home",*/}
                {/*          label: "Home",*/}
                {/*        },*/}

                {/*        {*/}
                {/*          id: "orders",*/}
                {/*          label: "My orders",*/}
                {/*          // prefix: <SvgServer fill="#0B72C4" />,*/}
                {/*        },*/}
                {/*        {*/}
                {/*          id: "items",*/}
                {/*          label: "My items",*/}
                {/*        },*/}
                {/*        {*/}
                {/*          id: "account",*/}
                {/*          label: "Settings",*/}
                {/*        },*/}
                {/*      ]}*/}
                {/*    />*/}
                {/*  </div>*/}
                {/*) : (*/}
                {/*  <></>*/}
                {/*)}*/}
            </div>
        </nav>
    );
}
