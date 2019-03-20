cd ~/price-logger

if [ -d ~/price-logger/logger ]; then
    sudo rm -r logger
fi

mkdir logger

tar -zxvf ~/logger.tar.gz -C logger

echo "logger unpacked, pip3 install"

cd logger

pip3 install -r requirements.txt

echo "install finished, restarting service"

sudo mv ~/logger.service /etc/systemd/system/logger.service

sudo systemctl restart logger.service

systemctl status logger