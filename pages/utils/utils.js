export function getChatId(address1, address2) {
  const lowerAddress1 = address1.toLowerCase();
  const lowerAddress2 = address2.toLowerCase();

  if (lowerAddress1 < lowerAddress2) return lowerAddress1 + lowerAddress2;

  return lowerAddress2 + lowerAddress1;
}

export function extractEvmAddresses(str) {
  const evmAddressRegex = /0x[0-9a-fA-F]{40}/g; // Regular expression to match EVM addresses
  const evmAddresses = str.match(evmAddressRegex); // Find all matches in the string

  return evmAddresses || []; // Return the array of EVM addresses or an empty array if no matches found
}
