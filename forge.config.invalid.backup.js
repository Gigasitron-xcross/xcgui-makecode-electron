@'
const path = require("node:path");

const allowedTopLevelItems = new Set([
    "main.js",
    "package.json",
    "editor"
]);

module.exports = {
    packagerConfig: {
        asar: true,

        /*
         * This application has no runtime Node packages.
         * main.js only uses Electron and built-in Node modules.
         */
        prune: false,

        /*
         * Do not follow a directory junction or symbolic link
         * into another large directory.
         */
        derefSymlinks: false,

        /*
         * Package only:
         *
         * main.js
         * package.json
         * editor\
         */
        ignore: (absolutePath) => {
            const relativePath = path.relative(
                __dirname,
                absolutePath
            );

            if (
                !relativePath ||
                relativePath === "."
            ) {
                return false;
            }

            const topLevelItem =
                relativePath.split(path.sep)[0];

            return !allowedTopLevelItems.has(
                topLevelItem
            );
        }
    },

    rebuildConfig: {},

    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                name: "xcgui_makecode"
            }
        }
    ],

    /*
     * Keep the first successful build simple.
     * The optional plugins can be restored later.
     */
    plugins: []
};
'@ | Set-Content `
    ".\forge.config.js" `
    -Encoding UTF8