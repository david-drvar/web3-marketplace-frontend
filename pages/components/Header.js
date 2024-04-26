import Link from "next/link";
import { ConnectButton } from "web3uikit";

export default function Header() {
  return (
    <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
      <h1 className="py-4 px-4 font-bold text-3xl">Marketplace</h1>
      <Link href="/">Marketplace</Link>
      <ConnectButton />
    </nav>
  );
}
