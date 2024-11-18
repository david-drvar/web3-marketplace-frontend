import Link from 'next/link';

export default function Custom404() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
            <h1 className="text-6xl font-bold text-blue-600">404</h1>
            <p className="mt-4 text-2xl">Page Not Found</p>
            <p className="mt-2 text-lg text-gray-600">Oops! The page you’re looking for doesn’t exist.</p>
            <Link href="/" className="mt-5 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">
                    Go Back Home
            </Link>
        </div>
    );
}
