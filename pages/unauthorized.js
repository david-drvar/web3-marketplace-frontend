export default function UnauthorizedPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-500 mb-4">Unauthorized</h1>
                    <p className="text-gray-700 mb-4">
                        You are not authorized to view this page.
                    </p>
                </div>
            </div>
        </div>
    );
}