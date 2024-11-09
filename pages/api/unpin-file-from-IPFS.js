const pinataSDK = require("@pinata/sdk");
const pinata = new pinataSDK({ pinataJWTKey: process.env.NEXT_PUBLIC_PINATA_JWT });

export const config = {
  api: {
    bodyParser: true,
  },
};

const unpinFile = async (hash) => {
  try {
    const response = await pinata.unpin(hash);
    return response;
  } catch (error) {
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { hash } = req.body;
      const response = await unpinFile(hash);
      return res.send(response);
    } catch (e) {
      console.log(e);
      res.status(500).send("Server Error");
    }
  }
}
