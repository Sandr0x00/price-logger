cd ~/price-logger

if [ -d ~/price-logger/visualization ]; then
    sudo rm -r visualization
fi

mkdir visualization

tar -zxvf ~/visualization.tar.gz -C visualization

echo "visualization unpacked, starting npm install"

cd visualization

npm install --production

echo "npm install successful, restarting service"

sudo mv ~/visualization.service /etc/systemd/system/visualization.service

sudo systemctl restart visualization.service

sudo systemctl status visualization
