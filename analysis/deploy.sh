cd ~/price-logger

if [ -d ~/price-logger/analysis ]; then
    sudo rm -r analysis
fi

mkdir analysis

tar -zxvf ~/analysis.tar.gz -C analysis

echo "analysis unpacked, starting npm install"

cd analysis

npm install --production

echo "npm install successful, restarting service"

sudo mv ~/analysis.service /etc/systemd/system/analysis.service

sudo systemctl restart analysis.service

sudo systemctl status analysis
