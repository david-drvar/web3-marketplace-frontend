export function getChatID(address1, address2) {
  const lowerAddress1 = address1.toLowerCase();
  const lowerAddress2 = address2.toLowerCase();

  if (lowerAddress1 < lowerAddress2) return lowerAddress1 + lowerAddress2;

  return lowerAddress2 + lowerAddress1;
}
