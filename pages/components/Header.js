import Link from "next/link";
import { ConnectButton } from "web3uikit";

export default function Header() {
  return (
    <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
      <Link href="/">
        <h1 className="py-4 px-4 font-bold text-3xl">Marketplace</h1>
      </Link>

      <div className="flex flex-row items-center">
        <Link href="/" className="mr-4 p-6">
          Home
        </Link>
        <Link href="/list-item" className="mr-4 p-6">
          List item
        </Link>
        <ConnectButton moralisAuth={false} />
      </div>
    </nav>
  );
}
