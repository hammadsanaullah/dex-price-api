const express = require("express");
const router = express.Router();

router.get("/getBalance", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const decoded = await verifyToken(token);
    const userDetails = await User.findOne({
      email: decoded.email,
    });
    if (userDetails) {
      tronWeb.setAddress(userDetails.wallet_address);
      let instance = await tronWeb.contract(
        abi,
        "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
      ); //USDT contract address
      try {
        let res = await instance.balanceOf(address).call();
        const balance = Number(res) / 1000000;
        console.log(balance);
        return res.status(200).json({ balance });
      } catch (error) {
        console.log(error);
        return res.status(400).json({ error });
      }
    } else {
      return res.status(404).json({ message: "User Not Found!!!" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
