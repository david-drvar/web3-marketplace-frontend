const RatingDisplay = ({rating, reviewCount}) => {
    const renderStars = () => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={`full-${i}`} className="text-yellow-500">★</span>);
        }

        if (hasHalfStar) {
            stars.push(<span key="half" className="text-yellow-500">⯨</span>); // A half-star approximation
        }

        for (let i = 0; i < emptyStars; i++) {
            stars.push(<span key={`empty-${i}`} className="text-yellow-500">☆</span>);
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