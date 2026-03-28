import { exec } from 'child_process';

export function detectOS(callback: (os: string) => void) {
  exec('uname -a', (error, stdout) => {
    if (error) {
      callback('other');
      return;
    }
    const output = stdout.toLowerCase();
    if (output.includes('ubuntu')) callback('ubuntu');
    else if (output.includes('debian')) callback('debian');
    else if (output.includes('centos')) callback('centos');
    else if (output.includes('fedora')) callback('fedora');
    else if (output.includes('arch')) callback('arch');
    else if (output.includes('opensuse')) callback('opensuse');
    else if (output.includes('almalinux')) callback('almalinux');
    else if (output.includes('rocky')) callback('rocky');
    else if (output.includes('raspbian')) callback('raspbian');
    else callback('other');
  });
}
