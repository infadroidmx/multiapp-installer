export const guiScripts = {
  xfce: {
    en: `#!/bin/bash

# XFCE Desktop + xRDP + Turkish layout
sudo apt update && sudo apt upgrade -y
sudo apt install -y xfce4 xfce4-goodies
sudo apt install -y xrdp xserver-xorg-core xorgxrdp
echo xfce4-session > ~/.xsession
sudo cp ~/.xsession /etc/skel/.xsession
sudo localectl set-keymap trq
sudo localectl set-x11-keymap tr pc105 q
sudo update-locale LANG=tr_TR.UTF-8
sudo locale-gen tr_TR.UTF-8
sudo dpkg-reconfigure --frontend=noninteractive locales
sudo sed -i '/^\. \/etc\/X11\/Xsession/i \\nexport LANG=tr_TR.UTF-8\n\export LC_ALL=tr_TR.UTF-8\nsetxkbmap -layout tr -variant q' /etc/xrdp/startwm.sh
sudo sed -i '/^\[Xorg\]/,/^\[/ s/^#//' /etc/xrdp/xrdp.ini
sudo adduser xrdp ssl-cert
sudo systemctl restart xrdp
if sudo ufw status | grep -q active; then
    sudo ufw allow 3389/tcp
    echo "UFW is active – RDP port 3389 opened."
else
    echo "UFW is not active – skipping firewall rule."
fi
sudo systemctl set-default graphical.target
IP=$(hostname -I | awk '{print $1}')
echo
echo "✅ Setup complete. Connect via RDP to: $IP"
echo "🔁 Rebooting in 10 seconds to apply all changes..."
sleep 10
sudo reboot
`,
    es: `#!/bin/bash

# Escritorio XFCE + xRDP + distribución turca
sudo apt update && sudo apt upgrade -y
sudo apt install -y xfce4 xfce4-goodies
sudo apt install -y xrdp xserver-xorg-core xorgxrdp
echo xfce4-session > ~/.xsession
sudo cp ~/.xsession /etc/skel/.xsession
sudo localectl set-keymap trq
sudo localectl set-x11-keymap tr pc105 q
sudo update-locale LANG=tr_TR.UTF-8
sudo locale-gen tr_TR.UTF-8
sudo dpkg-reconfigure --frontend=noninteractive locales
sudo sed -i '/^\. \/etc\/X11\/Xsession/i \\nexport LANG=tr_TR.UTF-8\n\export LC_ALL=tr_TR.UTF-8\nsetxkbmap -layout tr -variant q' /etc/xrdp/startwm.sh
sudo sed -i '/^\[Xorg\]/,/^\[/ s/^#//' /etc/xrdp/xrdp.ini
sudo adduser xrdp ssl-cert
sudo systemctl restart xrdp
if sudo ufw status | grep -q active; then
    sudo ufw allow 3389/tcp
    echo "UFW está activo – puerto RDP 3389 abierto."
else
    echo "UFW no está activo – omitiendo regla de firewall."
fi
sudo systemctl set-default graphical.target
IP=$(hostname -I | awk '{print $1}')
echo
echo "✅ Configuración completa. Conéctese vía RDP a: $IP"
echo "🔁 Reiniciando en 10 segundos para aplicar todos los cambios..."
sleep 10
sudo reboot
`
  },
  gnome: {
    en: `#!/bin/bash

set -e
apt update && apt upgrade -y
DEBIAN_FRONTEND=noninteractive apt install -y ubuntu-gnome-desktop gnome-session gdm3
apt install -y xrdp xorgxrdp dbus-x11 x11-utils
sed -i 's/^AllowRootLogin=.*/AllowRootLogin=true/' /etc/xrdp/sesman.ini
cat <<EOF > /root/.xsession
export GNOME_SHELL_SESSION_MODE=ubuntu
export XDG_CURRENT_DESKTOP=ubuntu:GNOME
export XDG_SESSION_DESKTOP=ubuntu
export LANG=tr_TR.UTF-8
export LC_ALL=tr_TR.UTF-8
setxkbmap -layout tr -variant q
exec gnome-session
EOF
chmod +x /root/.xsession
localectl set-keymap trq
localectl set-x11-keymap tr pc105 q
locale-gen tr_TR.UTF-8
update-locale LANG=tr_TR.UTF-8
cat <<EOF > /etc/xrdp/startwm.sh
#!/bin/sh
export LANG=tr_TR.UTF-8
export LC_ALL=tr_TR.UTF-8
setxkbmap -layout tr -variant q
. /etc/X11/Xsession
EOF
chmod +x /etc/xrdp/startwm.sh
if ufw status | grep -q active; then
  ufw allow 3389/tcp
  echo "✓ UFW is active — port 3389 opened."
else
  echo "⚠ UFW is not active — skipping firewall rule."
fi
systemctl set-default graphical.target
systemctl restart xrdp xrdp-sesman
IP=$(hostname -I | awk '{print $1}')
echo
echo "✅ Setup complete. You can now connect via RDP to: $IP"
echo "🔁 Rebooting in 10 seconds..."
sleep 10
reboot
`,
    es: `#!/bin/bash

set -e
apt update && apt upgrade -y
DEBIAN_FRONTEND=noninteractive apt install -y ubuntu-gnome-desktop gnome-session gdm3
apt install -y xrdp xorgxrdp dbus-x11 x11-utils
sed -i 's/^AllowRootLogin=.*/AllowRootLogin=true/' /etc/xrdp/sesman.ini
cat <<EOF > /root/.xsession
export GNOME_SHELL_SESSION_MODE=ubuntu
export XDG_CURRENT_DESKTOP=ubuntu:GNOME
export XDG_SESSION_DESKTOP=ubuntu
export LANG=tr_TR.UTF-8
export LC_ALL=tr_TR.UTF-8
setxkbmap -layout tr -variant q
exec gnome-session
EOF
chmod +x /root/.xsession
localectl set-keymap trq
localectl set-x11-keymap tr pc105 q
locale-gen tr_TR.UTF-8
update-locale LANG=tr_TR.UTF-8
cat <<EOF > /etc/xrdp/startwm.sh
#!/bin/sh
export LANG=tr_TR.UTF-8
export LC_ALL=tr_TR.UTF-8
setxkbmap -layout tr -variant q
. /etc/X11/Xsession
EOF
chmod +x /etc/xrdp/startwm.sh
if ufw status | grep -q active; then
  ufw allow 3389/tcp
  echo "✓ UFW está activo — puerto 3389 abierto."
else
  echo "⚠ UFW no está activo — omitiendo regla de firewall."
fi
systemctl set-default graphical.target
systemctl restart xrdp xrdp-sesman
IP=$(hostname -I | awk '{print $1}')
echo
echo "✅ Configuración completa. Ahora puede conectarse vía RDP a: $IP"
echo "🔁 Reiniciando en 10 segundos..."
sleep 10
reboot
`
  }
  // Add more scripts for other GUIs
};
