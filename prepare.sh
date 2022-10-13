mkdir tmp
cd tmp
git clone https://github.com/gpBlockchain/startBlockchain.git
cd startBlockchain/ckbLightClient
sh prepare.sh
sh start.sh
echo "prepare ckbLightClient finish"
cd ../../
git clone https://github.com/TheWaWaR/ckb-cli-light-client.git
cd ckb-cli-light-client
cargo build
echo "prepare ckb-cli-light-client finish"
