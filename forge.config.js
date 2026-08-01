module.exports = {
    packagerConfig: {
        asar: true,

        /*
         * Exclude the large MakeCode editor from the Forge package step.
         * It will be copied into resources\editor separately with Robocopy.
         */
        ignore: [
            /[\\/]editor([\\/]|$)/,
            /[\\/]out([\\/]|$)/,
            /[\\/]forge\.config\..*backup.*\.js$/,
            /[\\/]main\..*backup.*\.js$/,
            /[\\/]package\..*backup.*\.json$/
        ],

        derefSymlinks: false
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

    plugins: []
};