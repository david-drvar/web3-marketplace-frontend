import React from "react";

const crypto = require('crypto');

export function getChatID(itemId, address1, address2, address3) {
    const sortedAddresses = [itemId, address1, address2, address3].sort();
    const concatenatedAddresses = sortedAddresses.join('');
    return crypto.createHash('sha256').update(concatenatedAddresses).digest('hex');
}

export function getCountries() {
    return [
        'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia',
        'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
        'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
        'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia',
        'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China',
        'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
        'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador',
        'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
        'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guyana',
        'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
        'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
        'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
        'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia',
        'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
        'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique',
        'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
        'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
        'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
        'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
        'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
        'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
        'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
        'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname',
        'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand',
        'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
        'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
        'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
        'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
    ];
}


export const uploadFile = async (fileToUpload) => {
    try {
        const formData = new FormData();
        formData.append("file", fileToUpload, {filename: fileToUpload.name});
        const res = await fetch("/api/upload-file-to-IPFS", {
            method: "POST",
            body: formData,
        });
        const ipfsHash = await res.text();
        return ipfsHash;
    } catch (e) {
        console.log(e);
        alert("Trouble uploading file");
        throw e;
    }
};


export async function removePinnedImage(hash) {
    try {
        const res = await fetch("/api/unpin-file-from-IPFS", {
            method: "POST",
            body: JSON.stringify({hash: hash}),
            headers: {
                "Content-Type": "application/json",
            },
        });
        const responseText = await res.text();
        console.log(responseText);
    } catch (e) {
        console.log(e);
        alert("Trouble removing file");
        throw e;
    }
}

export function handleNotification(dispatch, type, message, title) {
    dispatch({
        type: type,
        message: message,
        title: title,
        position: "topR",
    });
}

export const renderStars = (rating) => {
    const totalStars = 5;
    return Array.from({length: totalStars}, (_, i) => (
        <span key={i} className={`text-xl ${i < rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                {i < rating ? '★' : '☆'}
            </span>
    ));
};


export function getCategories() {
    return {
        "Electronics": ["Mobile Phones", "Laptops", "Cameras", "Headphones", "Smart Watches", "Other"],
        "Clothing": ["Men's Apparel", "Women's Apparel", "Kids' Apparel", "Accessories", "Man's shoes", "Women's shoes", "Other"],
        "Furniture": ["Living Room", "Bedroom", "Office", "Outdoor", "Other"],
        "Toys": ["Educational", "Outdoor", "Action Figures", "Building Sets", "Other"],
        "Books": ["Fiction", "Non-Fiction", "Children's Books", "Textbooks", "Other"],
        "Sports": ["Equipment", "Apparel", "Footwear", "Accessories", "Other"],
        "Home Appliances": ["Kitchen", "Laundry", "Heating & Cooling", "Other"],
        "Beauty": ["Skincare", "Makeup", "Fragrances", "Hair Care", "Other"],
        "Automotive": ["Parts", "Accessories", "Tools", "Other"],
        "Collectibles": ["Coins", "Stamps", "Trading Cards", "Art", "Other"],
    };
}


export const saniziteCondition = (condition) => {
    return condition.replace("_", " ");
}