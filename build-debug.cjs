const { build } = require('electron-builder');
const path = require('path');

console.log('--- Starting Electron Builder (Node API) ---');

build({
    config: {
        productName: "MultiappInstaller",
        directories: {
            output: "dist-electron"
        },
        files: [
            "dist/**/*",
            "electron/**/*",
            "package.json",
            "public/icon.ico"
        ],
        win: {
            target: "dir",
            icon: "public/icon.ico"
        },
        npmRebuild: false, // Bypassing native module rebuild issues
        asar: true
    }
}).then((result) => {
    console.log('--- Build Successful! ---');
    console.log(result);
}).catch((error) => {
    console.error('--- Build Failed! ---');
    console.error(error);
    process.exit(1);
});
