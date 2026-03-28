export const guiOptionsFull = [
  // Minimal GUIs
  { id: 'xfce', name: { en: 'XFCE Desktop', es: 'Escritorio XFCE' }, type: 'minimal', os: ['ubuntu', 'debian', 'arch', 'fedora', 'centos', 'opensuse', 'almalinux', 'rocky', 'raspbian'], description: { en: 'Lightweight XFCE desktop environment.', es: 'Entorno de escritorio XFCE ligero.' } },
  { id: 'lxde', name: { en: 'LXDE Desktop', es: 'Escritorio LXDE' }, type: 'minimal', os: ['ubuntu', 'debian', 'arch', 'fedora', 'centos', 'opensuse', 'almalinux', 'rocky', 'raspbian'], description: { en: 'Ultra-light LXDE desktop environment.', es: 'Entorno de escritorio LXDE ultra-ligero.' } },
  { id: 'mate', name: { en: 'MATE Desktop', es: 'Escritorio MATE' }, type: 'minimal', os: ['ubuntu', 'debian', 'arch', 'fedora', 'centos', 'opensuse', 'almalinux', 'rocky', 'raspbian'], description: { en: 'MATE desktop, classic GNOME 2 style.', es: 'Escritorio MATE, estilo clásico GNOME 2.' } },
  { id: 'i3', name: { en: 'i3 Window Manager', es: 'Gestor de ventanas i3' }, type: 'minimal', os: ['ubuntu', 'debian', 'arch', 'fedora', 'centos', 'opensuse', 'almalinux', 'rocky', 'raspbian'], description: { en: 'Minimal tiling window manager.', es: 'Gestor de ventanas minimalista.' } },
  { id: 'sway', name: { en: 'Sway Window Manager', es: 'Gestor de ventanas Sway' }, type: 'minimal', os: ['arch', 'ubuntu', 'debian', 'fedora'], description: { en: 'Wayland tiling window manager.', es: 'Gestor de ventanas Wayland.' } },
  { id: 'trinity', name: { en: 'Trinity Desktop', es: 'Escritorio Trinity' }, type: 'minimal', os: ['ubuntu', 'debian'], description: { en: 'Trinity, classic KDE 3 fork.', es: 'Trinity, bifurcación clásica de KDE 3.' } },
  { id: 'enlightenment', name: { en: 'Enlightenment', es: 'Enlightenment' }, type: 'minimal', os: ['ubuntu', 'debian', 'arch', 'fedora', 'opensuse'], description: { en: 'Enlightenment desktop.', es: 'Escritorio Enlightenment.' } },
  { id: 'openbox', name: { en: 'Openbox', es: 'Openbox' }, type: 'minimal', os: ['ubuntu', 'debian', 'arch', 'fedora', 'opensuse'], description: { en: 'Openbox window manager.', es: 'Gestor de ventanas Openbox.' } },
  { id: 'fluxbox', name: { en: 'Fluxbox', es: 'Fluxbox' }, type: 'minimal', os: ['ubuntu', 'debian', 'arch', 'fedora', 'opensuse'], description: { en: 'Fluxbox window manager.', es: 'Gestor de ventanas Fluxbox.' } },
  // Complete GUIs
  { id: 'gnome', name: { en: 'GNOME Desktop', es: 'Escritorio GNOME' }, type: 'complete', os: ['ubuntu', 'debian', 'arch', 'fedora', 'centos', 'opensuse', 'almalinux', 'rocky', 'raspbian'], description: { en: 'Full GNOME desktop environment.', es: 'Entorno de escritorio GNOME completo.' } },
  { id: 'kde', name: { en: 'KDE Plasma', es: 'KDE Plasma' }, type: 'complete', os: ['ubuntu', 'debian', 'arch', 'fedora', 'centos', 'opensuse', 'almalinux', 'rocky', 'raspbian'], description: { en: 'KDE Plasma, modern and feature-rich.', es: 'KDE Plasma, moderno y completo.' } },
  { id: 'cinnamon', name: { en: 'Cinnamon Desktop', es: 'Escritorio Cinnamon' }, type: 'complete', os: ['ubuntu', 'debian', 'arch', 'fedora', 'opensuse'], description: { en: 'Cinnamon desktop, Linux Mint style.', es: 'Escritorio Cinnamon, estilo Linux Mint.' } },
  { id: 'budgie', name: { en: 'Budgie Desktop', es: 'Escritorio Budgie' }, type: 'complete', os: ['ubuntu', 'debian', 'arch', 'fedora', 'opensuse'], description: { en: 'Budgie desktop, simple and elegant.', es: 'Escritorio Budgie, simple y elegante.' } },
  { id: 'deepin', name: { en: 'Deepin Desktop', es: 'Escritorio Deepin' }, type: 'complete', os: ['ubuntu', 'debian', 'arch', 'fedora', 'opensuse'], description: { en: 'Deepin desktop, beautiful and modern.', es: 'Escritorio Deepin, bonito y moderno.' } },
  { id: 'pantheon', name: { en: 'Pantheon Desktop', es: 'Escritorio Pantheon' }, type: 'complete', os: ['ubuntu', 'debian', 'arch', 'fedora', 'opensuse'], description: { en: 'Pantheon desktop, elementary OS style.', es: 'Escritorio Pantheon, estilo elementary OS.' } },
  { id: 'sugar', name: { en: 'Sugar Desktop', es: 'Escritorio Sugar' }, type: 'complete', os: ['ubuntu', 'debian', 'fedora'], description: { en: 'Sugar desktop for education.', es: 'Escritorio Sugar para educación.' } }
];

export const guiTypes = [
  { id: 'minimal', en: 'Minimal', es: 'Mínimo' },
  { id: 'complete', en: 'Complete', es: 'Completo' }
];
