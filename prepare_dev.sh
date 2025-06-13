mkdir tmp
cd tmp
git clone https://github.com/gpBlockchain/startBlockchain.git
cd startBlockchain
git checkout gp/update-fee-rate-checker
cd ckbDevWithIndexAndLightClient
sh prepare.sh
sh start.sh