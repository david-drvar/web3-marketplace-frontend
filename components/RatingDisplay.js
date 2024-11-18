const RatingDisplay = ({rating, reviewCount}) => {
    const renderStars = () => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <svg key={`full-${i}`} className="w-5 h-5 text-yellow-500 inline-block" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            );
        }

        if (hasHalfStar) {
            stars.push(
                <svg key="half" className="w-5 h-5 text-yellow-500 inline-block" fill="currentColor" viewBox="0 0 24 24">
                    <defs>
                        <clipPath id="half-star-clip">
                            <rect x="0" y="0" width="12" height="24" /> {/* Left half of the star */}
                        </clipPath>
                    </defs>
                    <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"
                        clipPath="url(#half-star-clip)"
                    />
                </svg>
            );
        }

        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <svg key={`empty-${i}`} className="w-5 h-5 text-gray-300 inline-block" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            );
        }

        return stars;
    };

    return (
        <div className="flex items-center space-x-2">
            {rating ? (
                <>
                    <p className="text-gray-800 font-semibold">{rating.toFixed(1)}</p>
                    <div className="flex">
                        {renderStars()}
                    </div>
                    <p className="text-sm text-gray-500">| {reviewCount} Reviews</p>
                </>
            ) : (
                <>
                    <span className="text-gray-600">☆</span>
                    <p className="text-gray-800">- No review given</p>
                </>
            )}
        </div>
    );
};

export default RatingDisplay;